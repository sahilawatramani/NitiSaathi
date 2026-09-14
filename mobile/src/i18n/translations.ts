/**
 * translations.ts — Complete, pure single-language dictionaries for NitiSaathi.
 * Strictly renders single language (Hindi, English, or Marathi) according to user selection.
 */

export type Language = 'hi' | 'en' | 'mr';

export interface TranslationSchema {
  common: {
    appName: string;
    appNameDisplay: string;
    continueBtn: string;
    backBtn: string;
    stepOf: string;
    loading: string;
    save: string;
    retry: string;
    error: string;
    success: string;
  };
  welcome: {
    tagline: string;
    chooseLanguage: string;
    continueBtn: string;
  };
  comfort: {
    title: string;
    subtitle: string;
    opt1Title: string;
    opt1Desc: string;
    opt2Title: string;
    opt2Desc: string;
    opt3Title: string;
    opt3Desc: string;
    continueBtn: string;
  };
  details: {
    title: string;
    subtitle: string;
    ageLabel: string;
    incomeLabel: string;
    platformsLabel: string;
    emiLabel: string;
    eShramLabel: string;
    epfoLabel: string;
    yes: string;
    no: string;
    continueBtn: string;
  };
  consent: {
    title: string;
    subtitle: string;
    txTitle: string;
    txDesc: string;
    schemeTitle: string;
    schemeDesc: string;
    fraudTitle: string;
    fraudDesc: string;
    notifTitle: string;
    notifDesc: string;
    reportTitle: string;
    reportDesc: string;
    getStartedBtn: string;
    footerNote: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    emailLabel: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    loginBtn: string;
    registerBtn: string;
    haveAccount: string;
    noAccount: string;
  };
  nav: {
    home: string;
    budget: string;
    assistant: string;
    schemes: string;
    fraud: string;
  };
  header: {
    appName: string;
    notifications: string;
    settings: string;
  };
  dashboard: {
    greeting: string;
    urgentAlert: string;
    availableBalance: string;
    savingsRate: string;
    weeklyTrend: string;
    urgentActions: string;
    action1Title: string;
    action1Desc: string;
    action2Title: string;
    action2Desc: string;
    financialHealth: string;
    healthAtRisk: string;
    healthStable: string;
    actionDetails: string;
  };
  budget: {
    title: string;
    safeToSpend: string;
    forecastedIncome: string;
    steadyIncomeCallout: string;
    savingsGoal: string;
    causalPlan: string;
    causal1: string;
    causal2: string;
    monthlyProjection: string;
    viewDetails: string;
  };
  assistant: {
    newChat: string;
    liveStatus: string;
    initialMsg: string;
    inputPlaceholder: string;
    insightHeading: string;
    confidenceBadge: string;
    disclaimerText: string;
    quickQ1: string;
    quickQ2: string;
    quickQ3: string;
    listening: string;
  };
  schemes: {
    title: string;
    searchPlaceholder: string;
    all: string;
    insurance: string;
    pension: string;
    welfare: string;
    verified: string;
    viewDetails: string;
    budgetGuidance: string;
    verifiedDate: string;
    applyNow: string;
  };
  fraud: {
    title: string;
    bannerText: string;
    checkTitle: string;
    checkPlaceholder: string;
    checkBtn: string;
    checkingBtn: string;
    flaggedTitle: string;
    legitBtn: string;
    fraudBtn: string;
    resultSafe: string;
    resultScam: string;
    riskScore: string;
  };
  nudges: {
    title: string;
    helpful: string;
    notHelpful: string;
    markRead: string;
    emptyNudges: string;
  };
  settings: {
    title: string;
    profileName: string;
    profileSubtitle: string;
    languageTitle: string;
    accessibilityTitle: string;
    consentTitle: string;
    logoutBtn: string;
    voiceGuidance: string;
    highContrast: string;
  };
  profile: {
    title: string;
    subtitle: string;
    edit: string;
    save: string;
    saving: string;
    saveBtn: string;
    setupHint: string;
    personalSection: string;
    personalDesc: string;
    ageLabel: string;
    stateLabel: string;
    aggregatorLabel: string;
    retirementLabel: string;
    financialSection: string;
    financialDesc: string;
    incomeLabel: string;
    expensesLabel: string;
    emiLabel: string;
    savingsLabel: string;
    riskLabel: string;
    lowRisk: string;
    medRisk: string;
    highRisk: string;
    govSection: string;
    govDesc: string;
    epfoLabel: string;
    taxLabel: string;
    eShramLabel: string;
    aadhaarLabel: string;
    bankLabel: string;
    healthInsLabel: string;
    extraNotesLabel: string;
    extraNotesDesc: string;
    extraNotesPlaceholder: string;
    languageSection: string;
    yes: string;
    no: string;
    logoutBtn: string;
    savedSuccess: string;
    saveError: string;
  };
  more: {
    title: string;
    profile: string;
    seedData: string;
    fraudCheck: string;
    nudges: string;
    reports: string;
    settings: string;
  };
  reports: {
    title: string;
    monthlySummary: string;
    totalEarnings: string;
    totalExpenses: string;
    netSavings: string;
    downloadPdf: string;
  };
  transactions: {
    title: string;
    searchPlaceholder: string;
    emptyTitle: string;
    addTitle: string;
    expense: string;
    income: string;
    descLabel: string;
    merchantLabel: string;
    dateLabel: string;
    categoryLabel: string;
    recordExpense: string;
    recordIncome: string;
  };
}

export const translations: Record<Language, TranslationSchema> = {
  hi: {
    common: {
      appName: 'nitisaathi',
      appNameDisplay: 'नीति साथी',
      continueBtn: 'आगे बढ़ें →',
      backBtn: 'पीछे जाएं',
      stepOf: 'कदम',
      loading: 'लोड हो रहा है...',
      save: 'सहेजें',
      retry: 'पुनः प्रयास करें',
      error: 'त्रुटि हुई',
      success: 'सफलता',
    },
    welcome: {
      tagline: 'आपका भरोसेमंद वित्तीय साथी',
      chooseLanguage: 'अपनी भाषा चुनें',
      continueBtn: 'आगे बढ़ें →',
    },
    comfort: {
      title: 'आपको वित्तीय बातें कितनी समझ आती हैं?',
      subtitle: 'हम आपकी भाषा और समझ के अनुसार सलाह देंगे',
      opt1Title: 'सरल भाषा में बताएं',
      opt1Desc: 'मुझे केवल बुनियादी बातें पता हैं',
      opt2Title: 'कुछ शब्द पता हैं',
      opt2Desc: 'EMI, बचत, बीमा जैसे शब्द समझ आते हैं',
      opt3Title: 'अच्छे से समझ आते हैं',
      opt3Desc: 'निवेश, रिटर्न और योजनाओं की जानकारी है',
      continueBtn: 'आगे बढ़ें →',
    },
    details: {
      title: 'अपनी जानकारी भरें',
      subtitle: 'सही सरकारी योजनाएं और बजट बनाने के लिए',
      ageLabel: 'आपकी उम्र',
      incomeLabel: 'अनुमानित मासिक आय (₹)',
      platformsLabel: 'काम करने का प्लेटफॉर्म',
      emiLabel: 'चल रही EMI (₹/माह)',
      eShramLabel: 'ई-श्रम कार्ड है?',
      epfoLabel: 'EPFO या ESIC पंजीकृत?',
      yes: 'हाँ',
      no: 'नहीं',
      continueBtn: 'आगे बढ़ें →',
    },
    consent: {
      title: 'आपकी सहमति',
      subtitle: 'आप हर एक को अलग से चालू या बंद कर सकते हैं, कभी भी सेटिंग्स में बदल सकते हैं।',
      txTitle: 'लेन-देन जानकारी',
      txDesc: 'आपकी आय और खर्च ट्रैक करने के लिए',
      schemeTitle: 'योजना पात्रता जांच',
      schemeDesc: 'सही सरकारी योजनाएं दिखाने के लिए आपकी प्रोफाइल का उपयोग',
      fraudTitle: 'धोखाधड़ी सुरक्षा',
      fraudDesc: 'संदिग्ध लेन-देन और संदेशों की जांच के लिए',
      notifTitle: 'सूचनाएं व अलर्ट',
      notifDesc: 'समय पर जरूरी रिमाइंडर भेजने के लिए',
      reportTitle: 'मासिक रिपोर्ट',
      reportDesc: 'आपकी मासिक वित्तीय रिपोर्ट तैयार करने के लिए',
      getStartedBtn: 'शुरू करें',
      footerNote: 'आप बाद में इन्हें सेटिंग्स में बदल सकते हैं',
    },
    auth: {
      loginTitle: 'लॉग इन करें',
      registerTitle: 'खाता बनाएं',
      emailLabel: 'ईमेल',
      passwordLabel: 'पासवर्ड',
      confirmPasswordLabel: 'पासवर्ड दोहराएं',
      loginBtn: 'लॉग इन करें',
      registerBtn: 'रजिस्टर करें',
      haveAccount: 'पहले से खाता है? लॉग इन करें',
      noAccount: 'खाता नहीं है? रजिस्टर करें',
    },
    nav: {
      home: 'गृह',
      budget: 'बजट',
      assistant: 'साथी',
      schemes: 'योजनाएं',
      fraud: 'जांच',
    },
    header: {
      appName: 'नीति साथी',
      notifications: 'सूचनाएं',
      settings: 'सेटिंग्स',
    },
    dashboard: {
      greeting: 'नमस्ते राजेश 👋',
      urgentAlert: 'PMSBY डेबिट 9 दिनों में देय है • वर्तमान शेष: ₹10.00',
      availableBalance: 'उपलब्ध शेष',
      savingsRate: '10% बचत दर',
      weeklyTrend: 'साप्ताहिक आय प्रवृत्ति (WMA 4-सप्ताह)',
      urgentActions: 'ज़रूरी कार्रवाई',
      action1Title: 'PMSBY बीमा किस्त सुरक्षित करें',
      action1Desc: '₹20 शेष की आवश्यकता है (खाता शेष कम है)',
      action2Title: 'e-Shram कार्ड नवीनीकरण',
      action2Desc: 'स्टेट वेलफेयर बोर्ड से ₹1,000 दुर्घटना कवर सक्षम',
      financialHealth: 'वित्तीय स्थिति',
      healthAtRisk: 'जोखिम में (कम शेष)',
      healthStable: 'स्थिर',
      actionDetails: 'विवरण देखें',
    },
    budget: {
      title: 'मासिक बजट व पूर्वानुमान',
      safeToSpend: 'खर्च करने की सुरक्षित सीमा',
      forecastedIncome: 'अनुमानित आय',
      steadyIncomeCallout: 'स्थिर आय का अनुमान • खर्च सीमित रखें',
      savingsGoal: 'बचत लक्ष्य (10%)',
      causalPlan: 'सुझाई गई बचत योजना',
      causal1: 'दैनिक खर्च ₹450 तक सीमित रखें',
      causal2: 'शनिवार/रविवार अतिरिक्त 2 घंटे काम करें',
      monthlyProjection: 'मासिक अनुमान',
      viewDetails: 'विवरण देखें',
    },
    assistant: {
      newChat: '+ नई बातचीत',
      liveStatus: 'बजट और योजनाएं देख रहे हैं...',
      initialMsg: 'नमस्ते राजेश! मैं आपका नीति साथी हूँ। आप मुझसे सरकारी योजनाओं, बजट या पैसों के बारे में कोई भी सवाल पूछ सकते हैं।',
      inputPlaceholder: 'अपना सवाल यहाँ लिखें या बोलें...',
      insightHeading: 'यहाँ एक बात ध्यान देने वाली है',
      confidenceBadge: '85% विश्वसनीयता',
      disclaimerText: '⚠️ यह जानकारी सामान्य मार्गदर्शन के लिए है। किसी योजना में शामिल होने से पहले आधिकारिक पोर्टल पर जाँचें।',
      quickQ1: 'मेरे लिए कौन सी सरकारी योजना सही है?',
      quickQ2: 'PMSBY का प्रीमियम कब कटेगा?',
      quickQ3: 'मैं हर महीने ₹500 कैसे बचाऊं?',
      listening: 'सुन रहे हैं...',
    },
    schemes: {
      title: 'सरकारी योजनाएं',
      searchPlaceholder: 'योजनाएं खोजें...',
      all: 'सभी',
      insurance: 'बीमा',
      pension: 'पेंशन',
      welfare: 'कल्याण',
      verified: 'सत्यापित',
      viewDetails: 'विवरण देखें →',
      budgetGuidance: 'बजट मार्गदर्शन उपलब्ध',
      verifiedDate: '1 जुलाई 2026',
      applyNow: 'आवेदन करें',
    },
    fraud: {
      title: 'धोखाधड़ी जांच',
      bannerText: 'सावधान! OTP या बैंक पिन कभी किसी को न बताएं। बैंक कभी कॉल पर पिन नहीं मांगता।',
      checkTitle: 'संदिग्ध संदेश की जांच',
      checkPlaceholder: 'संदिग्ध SMS या WhatsApp संदेश यहाँ पेस्ट करें...',
      checkBtn: 'संदेश जांचें',
      checkingBtn: 'जांच हो रही है...',
      flaggedTitle: 'चिन्हित संदिग्ध लेन-देन (2)',
      legitBtn: '✓ सही है',
      fraudBtn: '🚫 धोखाधड़ी है',
      resultSafe: '✅ यह संदेश सुरक्षित प्रतीत होता है।',
      resultScam: '🚨 सावधान! यह एक धोखाधड़ी (Scam) संदेश है। किसी भी लिंक पर क्लिक न करें।',
      riskScore: 'जोखिम स्तर',
    },
    nudges: {
      title: 'ज़रूरी अलर्ट व सूचनाएं',
      helpful: 'मददगार लगा',
      notHelpful: 'ज़रूरी नहीं',
      markRead: 'पढ़ा हुआ चिन्हित करें',
      emptyNudges: 'कोई नया अलर्ट नहीं है।',
    },
    settings: {
      title: 'सेटिंग्स',
      profileName: 'राजेश (गिग वर्कर)',
      profileSubtitle: 'Swiggy • Zomato • Rapido',
      languageTitle: 'भाषा चुनें',
      accessibilityTitle: 'सुलभता व आवाज',
      consentTitle: 'सहमति और गोपनीयता',
      logoutBtn: 'लॉग आउट',
      voiceGuidance: 'आवाज मार्गदर्शन (Text-to-Speech)',
      highContrast: 'हाई कंट्रास्ट मोड',
    },
    profile: {
      title: 'प्रोफ़ाइल',
      subtitle: 'आपकी वित्तीय व सरकारी योजना प्रोफाइल',
      edit: 'बदलें',
      save: 'सहेजें',
      saving: 'सहेजा जा रहा है...',
      saveBtn: 'प्रोफ़ाइल सहेजें',
      setupHint: '✏️ अपनी प्रोफ़ाइल में जानकारी दर्ज करें और सहेजें',
      personalSection: '1. व्यक्तिगत जानकारी',
      personalDesc: 'अपनी बुनियादी जानकारी यहाँ दर्ज करें',
      ageLabel: 'आपकी उम्र (वर्ष)',
      stateLabel: 'राज्य (उदा. महाराष्ट्र / दिल्ली)',
      aggregatorLabel: 'प्लेटफ़ॉर्म पर सक्रिय दिन',
      retirementLabel: 'लक्षित सेवानिवृत्ति आयु (वर्ष)',
      financialSection: '2. वित्तीय विवरण',
      financialDesc: 'अपनी मासिक कमाई, खर्च व बचत दर्ज करें',
      incomeLabel: 'मासिक आय (₹)',
      expensesLabel: 'मासिक खर्च (₹)',
      emiLabel: 'मासिक EMI (₹)',
      savingsLabel: 'वर्तमान बचत (₹)',
      riskLabel: 'जोखिम उठाने की क्षमता',
      lowRisk: 'कम जोखिम',
      medRisk: 'मध्यम जोखिम',
      highRisk: 'उच्च जोखिम',
      govSection: '3. सरकारी योजना पात्रता व स्थिति',
      govDesc: 'सरकारी योजनाओं के लिए अपनी पात्रता स्थिति चुनें',
      epfoLabel: 'EPFO / ESIC पंजीकृत',
      taxLabel: 'आयकर दाता',
      eShramLabel: 'ई-श्रम पंजीकृत',
      aadhaarLabel: 'आधार लिंक्ड बैंक खाता',
      bankLabel: 'सक्रिय बचत बैंक खाता',
      healthInsLabel: 'स्वास्थ्य बीमा उपलब्ध',
      extraNotesLabel: '4. अतिरिक्त विवरण / नोट्स',
      extraNotesDesc: 'अन्य कोई विशेष टिप्पणी या जानकारी दर्ज करें',
      extraNotesPlaceholder: 'कोई अन्य विवरण या योजना से जुड़ा नोट यहाँ लिखें...',
      languageSection: 'ऐप की भाषा',
      yes: 'हाँ',
      no: 'नहीं',
      logoutBtn: 'लॉग आउट',
      savedSuccess: 'प्रोफ़ाइल सफलतापूर्वक डेटाबेस में सहेज ली गई।',
      saveError: 'प्रोफ़ाइल सहेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    },
    more: {
      title: 'अन्य सुविधाएं',
      profile: 'प्रोफ़ाइल',
      seedData: 'टेस्ट डेटा लोड करें',
      fraudCheck: 'धोखाधड़ी जांच',
      nudges: 'अलर्ट व सूचनाएं',
      reports: 'मासिक रिपोर्ट',
      settings: 'सेटिंग्स',
    },
    reports: {
      title: 'मासिक रिपोर्ट',
      monthlySummary: 'मासिक सारांश',
      totalEarnings: 'कुल कमाई',
      totalExpenses: 'कुल खर्च',
      netSavings: 'शुद्ध बचत',
      downloadPdf: 'PDF डाउनलोड करें',
    },
    transactions: {
      title: 'लेन-देन',
      searchPlaceholder: 'लेन-देन खोजें...',
      emptyTitle: 'कोई लेन-देन दर्ज नहीं है',
      addTitle: 'नया लेन-देन जोड़ें',
      expense: 'खर्च',
      income: 'आय',
      descLabel: 'विवरण',
      merchantLabel: 'व्यापारी / स्रोत (वैकल्पिक)',
      dateLabel: 'तारीख',
      categoryLabel: 'श्रेणी',
      recordExpense: 'खर्च दर्ज करें',
      recordIncome: 'आय दर्ज करें',
    },
  },

  en: {
    common: {
      appName: 'nitisaathi',
      appNameDisplay: 'NitiSaathi',
      continueBtn: 'Continue →',
      backBtn: 'Back',
      stepOf: 'Step',
      loading: 'Loading...',
      save: 'Save',
      retry: 'Retry',
      error: 'An error occurred',
      success: 'Success',
    },
    welcome: {
      tagline: 'Your trusted financial companion',
      chooseLanguage: 'Choose your language',
      continueBtn: 'Continue →',
    },
    comfort: {
      title: 'How comfortable are you with financial terms?',
      subtitle: 'We will tailor our guidance to your understanding level',
      opt1Title: 'Explain in simple terms',
      opt1Desc: 'I only know the basics',
      opt2Title: 'I know common terms',
      opt2Desc: 'I understand terms like EMI, savings, insurance',
      opt3Title: 'I understand well',
      opt3Desc: 'I know about investments, returns, and government schemes',
      continueBtn: 'Continue →',
    },
    details: {
      title: 'Enter your details',
      subtitle: 'To find matching schemes and build your custom budget',
      ageLabel: 'Your Age',
      incomeLabel: 'Approximate monthly income (₹)',
      platformsLabel: 'Working platforms',
      emiLabel: 'Ongoing EMI (₹/month)',
      eShramLabel: 'Do you have an e-Shram card?',
      epfoLabel: 'Registered with EPFO or ESIC?',
      yes: 'Yes',
      no: 'No',
      continueBtn: 'Continue →',
    },
    consent: {
      title: 'Your Consent',
      subtitle: 'You can turn each item on or off separately, anytime in Settings.',
      txTitle: 'Transaction Data',
      txDesc: 'To track your income and expenses safely',
      schemeTitle: 'Scheme Eligibility Check',
      schemeDesc: 'Use your profile to recommend matching government schemes',
      fraudTitle: 'Fraud Protection',
      fraudDesc: 'Detect suspicious transactions and scam messages',
      notifTitle: 'Push Notifications',
      notifDesc: 'Send timely alerts and insurance renewal reminders',
      reportTitle: 'Monthly Report',
      reportDesc: 'Generate your monthly financial summary report',
      getStartedBtn: 'Get Started',
      footerNote: 'You can change these anytime in Settings',
    },
    auth: {
      loginTitle: 'Sign In',
      registerTitle: 'Create Account',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      confirmPasswordLabel: 'Confirm Password',
      loginBtn: 'Sign In',
      registerBtn: 'Register',
      haveAccount: 'Already have an account? Sign In',
      noAccount: "Don't have an account? Register",
    },
    nav: {
      home: 'Home',
      budget: 'Budget',
      assistant: 'Assistant',
      schemes: 'Schemes',
      fraud: 'Fraud Check',
    },
    header: {
      appName: 'NitiSaathi',
      notifications: 'Notifications',
      settings: 'Settings',
    },
    dashboard: {
      greeting: 'Hello Rajesh 👋',
      urgentAlert: 'PMSBY debit due in 9 days • Current balance: ₹10.00',
      availableBalance: 'Available Balance',
      savingsRate: '10% Savings Rate',
      weeklyTrend: 'Weekly Income Trend (4-Week WMA)',
      urgentActions: 'Action Required',
      action1Title: 'Secure PMSBY Insurance Premium',
      action1Desc: '₹20 balance needed (Account balance is low)',
      action2Title: 'e-Shram Card Renewal',
      action2Desc: 'Enables ₹1,000 accident cover from State Board',
      financialHealth: 'Financial Health',
      healthAtRisk: 'At Risk (Low Balance)',
      healthStable: 'Stable',
      actionDetails: 'View Details',
    },
    budget: {
      title: 'Monthly Budget & Forecast',
      safeToSpend: 'Safe to Spend',
      forecastedIncome: 'Forecasted Income',
      steadyIncomeCallout: 'Steady income projection • Keep spend steady',
      savingsGoal: 'Savings Target (10%)',
      causalPlan: 'Recommended Savings Plan',
      causal1: 'Cap daily discretionary spending at ₹450',
      causal2: 'Work 2 additional hours on weekends',
      monthlyProjection: 'Monthly Forecast',
      viewDetails: 'View Details',
    },
    assistant: {
      newChat: '+ New Chat',
      liveStatus: 'Checking budget and schemes...',
      initialMsg: 'Hello Rajesh! I am your NitiSaathi companion. Ask me anything about government schemes, budgeting, or emergency funds.',
      inputPlaceholder: 'Type or speak your question...',
      insightHeading: 'Key Insight to Note',
      confidenceBadge: '85% Confidence',
      disclaimerText: '⚠️ This information is for general guidance only. Verify on official portal before enrolling.',
      quickQ1: 'Which government schemes am I eligible for?',
      quickQ2: 'When is my PMSBY premium debited?',
      quickQ3: 'How can I save ₹500 every month?',
      listening: 'Listening...',
    },
    schemes: {
      title: 'Government Schemes',
      searchPlaceholder: 'Search schemes...',
      all: 'All',
      insurance: 'Insurance',
      pension: 'Pension',
      welfare: 'Welfare',
      verified: 'Verified',
      viewDetails: 'View Details →',
      budgetGuidance: 'Budget guidance available',
      verifiedDate: 'July 1, 2026',
      applyNow: 'Apply Now',
    },
    fraud: {
      title: 'Fraud & Scam Check',
      bannerText: 'Warning! Never share OTP or bank PIN with anyone. Banks never ask for PINs over phone.',
      checkTitle: 'Check Suspicious Message',
      checkPlaceholder: 'Paste suspicious SMS or WhatsApp message here...',
      checkBtn: 'Check Message',
      checkingBtn: 'Checking message...',
      flaggedTitle: 'Flagged Suspicious Transactions (2)',
      legitBtn: '✓ Legitimate',
      fraudBtn: '🚫 Fraud',
      resultSafe: '✅ This message appears safe.',
      resultScam: '🚨 Warning! This is a scam message. Do not click any links.',
      riskScore: 'Risk Level',
    },
    nudges: {
      title: 'Urgent Alerts & Nudges',
      helpful: 'Helpful',
      notHelpful: 'Not Needed',
      markRead: 'Mark as read',
      emptyNudges: 'No new alerts.',
    },
    settings: {
      title: 'Settings',
      profileName: 'Rajesh (Gig Worker)',
      profileSubtitle: 'Swiggy • Zomato • Rapido',
      languageTitle: 'App Language',
      accessibilityTitle: 'Accessibility & Voice',
      consentTitle: 'Consent & Privacy',
      logoutBtn: 'Log out',
      voiceGuidance: 'Voice Guidance (Text-to-Speech)',
      highContrast: 'High Contrast Mode',
    },
    profile: {
      title: 'Profile',
      subtitle: 'Your Financial & Government Scheme Profile',
      edit: 'Edit',
      save: 'Save',
      saving: 'Saving...',
      saveBtn: 'Save Profile',
      setupHint: '✏️ Enter your profile information and save',
      personalSection: '1. Personal Information',
      personalDesc: 'Enter your basic profile information',
      ageLabel: 'Your Age (Years)',
      stateLabel: 'State (e.g., Maharashtra / Delhi)',
      aggregatorLabel: 'Days Active on Platform',
      retirementLabel: 'Target Retirement Age (Years)',
      financialSection: '2. Financial Details',
      financialDesc: 'Enter your monthly earnings, spend, and savings',
      incomeLabel: 'Monthly Income (₹)',
      expensesLabel: 'Monthly Expenses (₹)',
      emiLabel: 'Monthly EMI (₹)',
      savingsLabel: 'Current Savings (₹)',
      riskLabel: 'Risk Tolerance',
      lowRisk: 'Low Risk',
      medRisk: 'Moderate Risk',
      highRisk: 'High Risk',
      govSection: '3. Scheme Eligibility & Status',
      govDesc: 'Select your eligibility status for government schemes',
      epfoLabel: 'EPFO / ESIC Registered',
      taxLabel: 'Income Tax Payer',
      eShramLabel: 'e-Shram Registered',
      aadhaarLabel: 'Aadhaar Linked Bank Account',
      bankLabel: 'Active Savings Bank Account',
      healthInsLabel: 'Health Insurance Active',
      extraNotesLabel: '4. Additional Notes / Details',
      extraNotesDesc: 'Enter any additional details or scheme notes',
      extraNotesPlaceholder: 'Add any specific notes or scheme details...',
      languageSection: 'App Language',
      yes: 'Yes',
      no: 'No',
      logoutBtn: 'Log Out',
      savedSuccess: 'Profile saved successfully to database.',
      saveError: 'Could not save profile. Please try again.',
    },
    more: {
      title: 'More Tools',
      profile: 'Profile',
      seedData: 'Load Test Data',
      fraudCheck: 'Fraud Check',
      nudges: 'Alerts & Nudges',
      reports: 'Monthly Reports',
      settings: 'Settings',
    },
    reports: {
      title: 'Monthly Reports',
      monthlySummary: 'Monthly Summary',
      totalEarnings: 'Total Earnings',
      totalExpenses: 'Total Expenses',
      netSavings: 'Net Savings',
      downloadPdf: 'Download PDF',
    },
    transactions: {
      title: 'Transactions',
      searchPlaceholder: 'Search transactions...',
      emptyTitle: 'No transactions recorded yet',
      addTitle: 'Add Transaction',
      expense: 'Expense',
      income: 'Income',
      descLabel: 'Description',
      merchantLabel: 'Merchant / Source (Optional)',
      dateLabel: 'Date',
      categoryLabel: 'Category',
      recordExpense: 'Record Expense',
      recordIncome: 'Record Income',
    },
  },

  mr: {
    common: {
      appName: 'nitisaathi',
      appNameDisplay: 'नीती साथी',
      continueBtn: 'पुढे चला →',
      backBtn: 'मागे जा',
      stepOf: 'टप्पा',
      loading: 'लोड होत आहे...',
      save: 'जतन करा',
      retry: 'पुन्हा प्रयत्न करा',
      error: 'त्रुटी आढळली',
      success: 'यशस्वी',
    },
    welcome: {
      tagline: 'तुमचा विश्वासू आर्थिक साथी',
      chooseLanguage: 'तुमची भाषा निवडा',
      continueBtn: 'पुढे चला →',
    },
    comfort: {
      title: 'तुम्हाला आर्थिक बाबी किती समजतात?',
      subtitle: 'आम्ही तुमच्या समजुतीनुसार योग्य मार्गदर्शन करू',
      opt1Title: 'सोप्या भाषेत सांगा',
      opt1Desc: 'मला फक्त मूलभूत गोष्टी माहित आहेत',
      opt2Title: 'काही शब्द माहित आहेत',
      opt2Desc: 'EMI, बचत, विमा यांसारखे शब्द समजतात',
      opt3Title: 'चांगल्या प्रकारे समजतात',
      opt3Desc: 'गुंतवणूक, परतावा आणि सरकारी योजनांची माहिती आहे',
      continueBtn: 'पुढे चला →',
    },
    details: {
      title: 'तुमची माहिती भरा',
      subtitle: 'योग्य सरकारी योजना आणि बजेट तयार करण्यासाठी',
      ageLabel: 'तुमचे वय',
      incomeLabel: 'अंदाजे मासिक उत्पन्न (₹)',
      platformsLabel: 'कामाचे प्लॅटफॉर्म',
      emiLabel: 'सुरू असलेली EMI (₹/महिना)',
      eShramLabel: 'ई-श्रम कार्ड आहे का?',
      epfoLabel: 'EPFO किंवा ESIC नोंदणीकृत?',
      yes: 'होय',
      no: 'नाही',
      continueBtn: 'पुढे चला →',
    },
    consent: {
      title: 'तुमची संमती',
      subtitle: 'तुम्ही प्रत्येक पर्याय स्वतंत्रपणे चालू किंवा बंद करू शकता, सेटिंग्जमध्ये कधीही बदलू शकता.',
      txTitle: 'व्यवहार माहिती',
      txDesc: 'तुमचे उत्पन्न आणि खर्च ट्रॅक करण्यासाठी',
      schemeTitle: 'योजना पात्रता तपासणी',
      schemeDesc: 'योग्य सरकारी योजना दाखवण्यासाठी प्रोफाइलचा वापर',
      fraudTitle: 'फसवणूक सुरक्षा',
      fraudDesc: 'संशयास्पद व्यवहार आणि संदेश तपासण्यासाठी',
      notifTitle: 'सूचना आणि अलर्ट',
      notifDesc: 'वेळेवर आवश्यक स्मरणपत्रे पाठवण्यासाठी',
      reportTitle: 'मासिक अहवाल',
      reportDesc: 'तुमचा मासिक आर्थिक अहवाल तयार करण्यासाठी',
      getStartedBtn: 'सुरू करा',
      footerNote: 'तुम्ही हे नंतर सेटिंग्जमध्ये बदलू शकता',
    },
    auth: {
      loginTitle: 'लॉग इन करा',
      registerTitle: 'खाते तयार करा',
      emailLabel: 'ईमेल',
      passwordLabel: 'पासवर्ड',
      confirmPasswordLabel: 'पासवर्ड पुन्हा टाका',
      loginBtn: 'लॉग इन करा',
      registerBtn: 'नोंदणी करा',
      haveAccount: 'आधीच खाते आहे? लॉग इन करा',
      noAccount: 'खाते नाही? नोंदणी करा',
    },
    nav: {
      home: 'गृह',
      budget: 'बजेट',
      assistant: 'साथी',
      schemes: 'योजना',
      fraud: 'तपासणी',
    },
    header: {
      appName: 'नीती साथी',
      notifications: 'सूचना',
      settings: 'सेटिंग्ज',
    },
    dashboard: {
      greeting: 'नमस्ते राजेश 👋',
      urgentAlert: 'PMSBY डेबिट 9 दिवसांत देय आहे • चालू शिल्लक: ₹10.00',
      availableBalance: 'उपलब्ध शिल्लक',
      savingsRate: '10% बचत दर',
      weeklyTrend: 'साप्ताहिक उत्पन्न कल (4-आठवडे WMA)',
      urgentActions: 'तातडीची कृती',
      action1Title: 'PMSBY विमा हप्ता सुरक्षित करा',
      action1Desc: '₹20 शिल्लक आवश्यक आहे (खाते शिल्लक कमी आहे)',
      action2Title: 'ई-श्रम कार्ड नूतनीकरण',
      action2Desc: 'राज्य कल्याण मंडळाकडून ₹1,000 अपघात कवच सक्षम',
      financialHealth: 'आर्थिक स्थिती',
      healthAtRisk: 'धोक्यात (कमी शिल्लक)',
      healthStable: 'स्थिर',
      actionDetails: 'तपशील पहा',
    },
    budget: {
      title: 'मासिक बजेट व अंदाज',
      safeToSpend: 'खर्च करण्याची सुरक्षित मर्यादा',
      forecastedIncome: 'अंदाजित उत्पन्न',
      steadyIncomeCallout: 'स्थिर उत्पन्न अंदाज • खर्च मर्यादित ठेवा',
      savingsGoal: 'बचत उद्दिष्ट (10%)',
      causalPlan: 'शिफारस केलेली बचत योजना',
      causal1: 'दैनिक खर्च ₹450 पर्यंत मर्यादित ठेवा',
      causal2: 'शनिवार/रविवार अतिरिक्त 2 तास काम करा',
      monthlyProjection: 'मासिक अंदाज',
      viewDetails: 'तपशील पहा',
    },
    assistant: {
      newChat: '+ नवीन संभाषण',
      liveStatus: 'बजेट आणि योजना तपासत आहे...',
      initialMsg: 'नमस्ते राजेश! मी तुमचा नीती साथी आहे. तुम्ही मला सरकारी योजना, बजेट किंवा पैशांविषयी कोणताही प्रश्न विचारू शकता.',
      inputPlaceholder: 'तुमचा प्रश्न येथे लिहा किंवा बोला...',
      insightHeading: 'येथे एक महत्त्वाची बाब लक्षात घेण्यासारखी आहे',
      confidenceBadge: '85% विश्वासार्हता',
      disclaimerText: '⚠️ ही माहिती सामान्य मार्गदर्शनासाठी आहे. कोणत्याही योजनेत सामील होण्यापूर्वी अधिकृत पोर्टलवर तपासा.',
      quickQ1: 'माझ्यासाठी कोणती सरकारी योजना योग्य आहे?',
      quickQ2: 'माझा PMSBY प्रीमियम कधी कापला जाईल?',
      quickQ3: 'मी दरमहा ₹500 कसे वाचवू?',
      listening: 'ऐकत आहे...',
    },
    schemes: {
      title: 'सरकारी योजना',
      searchPlaceholder: 'योजना शोधा...',
      all: 'सर्व',
      insurance: 'विमा',
      pension: 'पेन्शन',
      welfare: 'कल्याण',
      verified: 'सत्यापित',
      viewDetails: 'तपशील पहा →',
      budgetGuidance: 'बजेट मार्गदर्शन उपलब्ध',
      verifiedDate: '1 जुलै 2026',
      applyNow: 'अर्ज करा',
    },
    fraud: {
      title: 'फसवणूक तपासणी',
      bannerText: 'सावधान! तुमचा OTP किंवा बँक पिन कधीही कोणाला सांगू नका. बँक कधीही कॉलवर पिन मागत नाही.',
      checkTitle: 'संशयास्पद संदेशाची तपासणी',
      checkPlaceholder: 'संशयास्पद SMS किंवा WhatsApp संदेश येथे पेस्ट करा...',
      checkBtn: 'संदेश तपासा',
      checkingBtn: 'तपासणी सुरू आहे...',
      flaggedTitle: 'चिन्हांकित संशयास्पद व्यवहार (2)',
      legitBtn: '✓ योग्य आहे',
      fraudBtn: '🚫 फसवणूक आहे',
      resultSafe: '✅ हा संदेश सुरक्षित दिसतो.',
      resultScam: '🚨 सावधान! हा एक फसवणूक संदेश आहे. कोणत्याही लिंकवर क्लिक करू नका.',
      riskScore: 'धोका पातळी',
    },
    nudges: {
      title: 'तातडीचे अलर्ट आणि सूचना',
      helpful: 'उपयुक्त वाटले',
      notHelpful: 'गरज नाही',
      markRead: 'वाचलेले चिन्हांकित करा',
      emptyNudges: 'कोणतेही नवीन अलर्ट नाहीत.',
    },
    settings: {
      title: 'सेटिंग्ज',
      profileName: 'राजेश (गिग वर्कर)',
      profileSubtitle: 'Swiggy • Zomato • Rapido',
      languageTitle: 'भाषा निवडा',
      accessibilityTitle: 'सुलभता आणि आवाज',
      consentTitle: 'संमती आणि गोपनीयता',
      logoutBtn: 'लॉग आउट',
      voiceGuidance: 'आवाज मार्गदर्शन (Text-to-Speech)',
      highContrast: 'हाय कॉन्ट्रास्ट मोड',
    },
    profile: {
      title: 'प्रोफाइल',
      subtitle: 'तुमची आर्थिक व सरकारी योजना प्रोफाइल',
      edit: 'बदला',
      save: 'जतन करा',
      saving: 'जतन करत आहे...',
      saveBtn: 'प्रोफाइल जतन करा',
      setupHint: '✏️ तुमच्या प्रोफाइलमध्ये माहिती भरा आणि जतन करा',
      personalSection: '1. वैयक्तिक माहिती',
      personalDesc: 'तुमची मूलभूत माहिती येथे प्रविष्ट करा',
      ageLabel: 'तुमचे वय (वर्षे)',
      stateLabel: 'राज्य (उदा. महाराष्ट्र / दिल्ली)',
      aggregatorLabel: 'प्लॅटफॉर्मवर सक्रिय दिवस',
      retirementLabel: 'लक्षित निवृत्ती वय (वर्षे)',
      financialSection: '2. आर्थिक तपशील',
      financialDesc: 'तुमची मासिक कमाई, खर्च आणि बचत प्रविष्ट करा',
      incomeLabel: 'मासिक उत्पन्न (₹)',
      expensesLabel: 'मासिक खर्च (₹)',
      emiLabel: 'मासिक EMI (₹)',
      savingsLabel: 'सध्याची बचत (₹)',
      riskLabel: 'जोखीम क्षमता',
      lowRisk: 'कमी जोखीम',
      medRisk: 'मध्यम जोखीम',
      highRisk: 'उच्च जोखीम',
      govSection: '3. सरकारी योजना पात्रता व स्थिती',
      govDesc: 'सरकारी योजनांसाठी तुमची पात्रता स्थिती निवडा',
      epfoLabel: 'EPFO / ESIC नोंदणीकृत',
      taxLabel: 'आयकर भरणारे',
      eShramLabel: 'ई-श्रम नोंदणीकृत',
      aadhaarLabel: 'आधार लिंक बँक खाते',
      bankLabel: 'सक्रिय बचत बँक खाते',
      healthInsLabel: 'आरोग्य विमा उपलब्ध',
      extraNotesLabel: '4. अतिरिक्त नोंदी / तपशील',
      extraNotesDesc: 'इतर काही विशेष माहिती किंवा नोंद प्रविष्ट करा',
      extraNotesPlaceholder: 'इतर काही विशेष तपशील किंवा योजना नोंद येथे लिहा...',
      languageSection: 'अॅपची भाषा',
      yes: 'होय',
      no: 'नाही',
      logoutBtn: 'लॉग आउट',
      savedSuccess: 'प्रोफाइल यशस्वीरित्या डेटाबेसमध्ये जतन केली.',
      saveError: 'प्रोफाइल जतन करताना त्रुटी आली. पुन्हा प्रयत्न करा.',
    },
    more: {
      title: 'इतर साधने',
      profile: 'प्रोफाइल',
      seedData: 'टेस्ट डेटा लोड करा',
      fraudCheck: 'फसवणूक तपासणी',
      nudges: 'अलर्ट आणि सूचना',
      reports: 'मासिक अहवाल',
      settings: 'सेटिंग्ज',
    },
    reports: {
      title: 'मासिक अहवाल',
      monthlySummary: 'मासिक सारांश',
      totalEarnings: 'एकूण कमाई',
      totalExpenses: 'एकूण खर्च',
      netSavings: 'निव्वळ बचत',
      downloadPdf: 'PDF डाउनलोड करा',
    },
    transactions: {
      title: 'व्यवहार',
      searchPlaceholder: 'व्यवहार शोधा...',
      emptyTitle: 'कोणतेही व्यवहार नोंदवलेले नाहीत',
      addTitle: 'नवीन व्यवहार जोडा',
      expense: 'खर्च',
      income: 'उत्पन्न',
      descLabel: 'तपशील',
      merchantLabel: 'व्यापारी / स्त्रोत (पर्यायी)',
      dateLabel: 'तारीख',
      categoryLabel: 'श्रेणी',
      recordExpense: 'खर्च नोंदवा',
      recordIncome: 'उत्पन्न नोंदवा',
    },
  },
};
