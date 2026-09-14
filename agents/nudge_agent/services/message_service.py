"""
Message service to simplify and localize nudges using the Literacy Agent service.
Provides rich multilingual financial coaching templates (en, hi, mr) with graceful offline fallback.
"""
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

LITERACY_AGENT_URL = "http://localhost:8100/literacy/rewrite"

# Curated high-quality multilingual financial coaching templates
NUDGE_TEMPLATES = {
    "low_balance_before_debit": {
        "title": {
            "en": "PMSBY ₹20 Auto-Debit Due Soon",
            "hi": "PMSBY ₹20 ऑटो-डेबिट सूचना",
            "mr": "PMSBY ₹20 ऑटो-डेबिट सूचना",
        },
        "priority": "urgent",
        "action_url": "nitisaathi://schemes/pmsby",
        "action_label": {
            "en": "Check Balance",
            "hi": "बैलेंस जांचें",
            "mr": "शिल्लक तपासा",
        },
        "template": {
            "en": "Your PMSBY ₹20 debit is due in {days} days. Your balance is ₹{balance}; set aside ₹20 from your next payout to avoid losing your ₹2 Lakh accident cover.",
            "hi": "आपका PMSBY ₹20 बीमा ऑटो-डेबिट {days} दिनों में होना है। आपका शेष बैलेंस ₹{balance} है; ₹2 लाख दुर्घटना बीमा चालू रखने हेतु अगले भुगतान में से ₹20 सुरक्षित रखें।",
            "mr": "तुमचा PMSBY ₹20 विमा ऑटो-डेबिट {days} दिवसांत होणार आहे. तुमचे शिल्लक ₹{balance} आहे; ₹2 लाख अपघात विमा सुरू ठेवण्यासाठी पुढील कमाईतून ₹20 शिल्लक ठेवा.",
        },
    },
    "low_balance": {
        "title": {
            "en": "Low Balance Warning",
            "hi": "कम बैलेंस चेतावनी",
            "mr": "कमी शिल्लक इशारा",
        },
        "priority": "urgent",
        "action_url": "nitisaathi://budget",
        "action_label": {
            "en": "View Spending",
            "hi": "खर्च देखें",
            "mr": "खर्च पहा",
        },
        "template": {
            "en": "Your balance is ₹{balance}, which is low for your typical weekly earnings. Pause non-essential expenses until your next platform payout.",
            "hi": "आपका बैंक बैलेंस ₹{balance} है, जो आपकी सामान्य साप्ताहिक आय की तुलना में कम है। अगले भुगतान तक गैर-ज़रूरी खर्च रोकें।",
            "mr": "तुमचे बँक शिल्लक ₹{balance} आहे, जे तुमच्या साप्ताहिक उत्पन्नाच्या तुलनेत कमी आहे. पुढील पे-आऊट येईपर्यंत अनावश्यक खर्च टाळा.",
        },
    },
    "pmsby_debit_due": {
        "title": {
            "en": "Annual Insurance Renewal Due",
            "hi": "वार्षिक बीमा नवीनीकरण सूचना",
            "mr": "वार्षिक विमा नूतनीकरण सूचना",
        },
        "priority": "advisory",
        "action_url": "nitisaathi://schemes/pmsby",
        "action_label": {
            "en": "View PMSBY Details",
            "hi": "PMSBY विवरण देखें",
            "mr": "PMSBY माहिती पहा",
        },
        "template": {
            "en": "Your PMSBY annual renewal is approaching. Maintain at least ₹20 in your linked bank account for seamless accident protection.",
            "hi": "आपका PMSBY वार्षिक नवीनीकरण जल्द आने वाला है। निरंतर बीमा सुरक्षा के लिए खाते में कम से कम ₹20 बनाए रखें।",
            "mr": "तुमचे PMSBY वार्षिक नूतनीकरण लवकरच येणार आहे. अखंड विमा संरक्षणासाठी खात्यात किमान ₹20 ठेवा.",
        },
    },
    "missed_goal": {
        "title": {
            "en": "Savings Goal Behind Schedule",
            "hi": "बचत लक्ष्य अधूरा है",
            "mr": "बचत उद्दिष्ट मागे पडले आहे",
        },
        "priority": "advisory",
        "action_url": "nitisaathi://goals",
        "action_label": {
            "en": "Update Goal",
            "hi": "लक्ष्य अपडेट करें",
            "mr": "उद्दिष्ट अपडेट करा",
        },
        "template": {
            "en": "Your savings goal is behind target this week. Setting aside a small ₹100–₹200 from your next shift can help get back on track.",
            "hi": "आपका इस सप्ताह का बचत लक्ष्य पीछे रह गया है। अगली डिलीवरी शिफ्ट से ₹100–₹200 बचाकर आप पुनः ट्रैक पर आ सकते हैं।",
            "mr": "या आठवड्याचे तुमचे बचत उद्दिष्ट थोडे मागे पडले आहे. पुढील शिफ्टमधून ₹100–₹200 बाजूला काढून तुम्ही पुन्हा उद्दिष्ट गाठू शकता.",
        },
    },
    "high_volatility_streak": {
        "title": {
            "en": "High Income Volatility Advisory",
            "hi": "अनियमित आय सावधानी",
            "mr": "उत्पन्न चढ-उतार सल्ला",
        },
        "priority": "advisory",
        "action_url": "nitisaathi://budget",
        "action_label": {
            "en": "Adjust Budget",
            "hi": "बजट समायोजित करें",
            "mr": "बजेट समायोजित करा",
        },
        "template": {
            "en": "Your earnings have fluctuated significantly over recent weeks. Keep weekly savings targets flexible and avoid taking on new fixed commitments.",
            "hi": "हाल के हफ्तों में आपकी आय में काफी उतार-चढ़ाव आया है। अपनी बचत योजना को लचीला रखें और नई निश्चित EMI लेने से बचें।",
            "mr": "गेल्या काही आठवड्यांत तुमच्या कमाईत चढ-उतार झाला आहे. बचतीचे लक्ष्य लवचिक ठेवा आणि नवीन EMI घेणे टाळा.",
        },
    },
    "high_emi_burden": {
        "title": {
            "en": "High EMI Burden Alert",
            "hi": "उच्च EMI बोझ चेतावनी",
            "mr": "जास्त EMI भार इशारा",
        },
        "priority": "urgent",
        "action_url": "nitisaathi://debt-planner",
        "action_label": {
            "en": "Review Debt",
            "hi": "कर्ज समीक्षा करें",
            "mr": "कर्ज पुनरावलोकन",
        },
        "template": {
            "en": "Your monthly EMI commitments exceed 40% of your earnings. Prioritize debt repayments to prevent penalty charges.",
            "hi": "आपकी मासिक EMI आपकी कमाई के 40% से अधिक हो रही है। पेनल्टी से बचने के लिए ऋण अदायगी को प्राथमिकता दें।",
            "mr": "तुमची मासिक EMI तुमच्या उत्पन्नाच्या 40% पेक्षा जास्त आहे. दंड टाळण्यासाठी कर्जफेडीला प्राधान्य द्या.",
        },
    },
    "savings_milestone": {
        "title": {
            "en": "Savings Milestone Achieved!",
            "hi": "बचत उपलब्धि पूर्ण!",
            "mr": "बचत टप्पा पूर्ण झाला!",
        },
        "priority": "milestone",
        "action_url": "nitisaathi://goals",
        "action_label": {
            "en": "Celebrate Milestone",
            "hi": "उपलब्धि देखें",
            "mr": "टप्पा पहा",
        },
        "template": {
            "en": "Congratulations! You have consistently maintained your emergency buffer this month. Keep up the disciplined habit!",
            "hi": "बधाई हो! आपने इस महीने अपना आपातकालीन सुरक्षा फंड सफलतापूर्वक बनाए रखा है। यह बचत आदत जारी रखें!",
            "mr": "अभिनंदन! तुम्ही या महिन्यात तुमचा आणीबाणीचा फंड यशस्वीपणे राखला आहे. ही सवय कायम ठेवा!",
        },
    },
}


def get_template_message(trigger_id: str, language_pref: str = "en", **kwargs) -> Dict[str, Any]:
    """Retrieve pre-localized title, message, priority, and actions for a trigger."""
    lang = language_pref if language_pref in {"en", "hi", "mr"} else "en"
    cfg = NUDGE_TEMPLATES.get(trigger_id)
    if not cfg:
        return {
            "title": trigger_id.replace("_", " ").title(),
            "message": kwargs.get("raw_message", "Financial reminder from NitiSaathi"),
            "priority": "advisory",
            "action_url": None,
            "action_label": None,
        }

    title = cfg["title"].get(lang, cfg["title"]["en"])
    template = cfg["template"].get(lang, cfg["template"]["en"])
    action_label = cfg["action_label"].get(lang, cfg["action_label"]["en"]) if cfg.get("action_label") else None

    # Safe formatting
    try:
        formatted_msg = template.format(**kwargs)
    except Exception:
        formatted_msg = template

    return {
        "title": title,
        "message": formatted_msg,
        "priority": cfg.get("priority", "advisory"),
        "action_url": cfg.get("action_url"),
        "action_label": action_label,
    }


def simplify_message(
    raw_message: str,
    literacy_level: str = "medium",
    language_pref: str = "en",
    trigger_id: Optional[str] = None,
    **kwargs
) -> str:
    """
    Simplifies a raw message by POSTing to the Literacy Agent's rewrite endpoint.
    On connection error or timeout, gracefully falls back to the curated localized template.
    """
    if not raw_message:
        return raw_message

    lang = language_pref if language_pref in {"hi", "en", "mr"} else "en"

    payload = {
        "text": raw_message,
        "literacy_level": literacy_level,
        "language_pref": lang,
        "has_financial_content": True,
        "has_scheme_content": "pmsby" in raw_message.lower() or "insurance" in raw_message.lower() or "बीमा" in raw_message or "विमा" in raw_message,
    }

    try:
        response = requests.post(LITERACY_AGENT_URL, json=payload, timeout=1.0)
        if response.status_code == 200:
            data = response.json()
            return data.get("rewritten_text", raw_message)
        else:
            logger.warning("Literacy Agent returned %s. Using localized template.", response.status_code)
    except Exception as e:
        logger.debug("Literacy Agent not reachable: %s. Using localized template.", e)

    # Localized template fallback
    if trigger_id and trigger_id in NUDGE_TEMPLATES:
        t_data = get_template_message(trigger_id, language_pref=lang, **kwargs)
        return t_data["message"]

    return raw_message
