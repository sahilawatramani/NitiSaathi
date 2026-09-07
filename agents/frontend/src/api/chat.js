export const getChatHistory = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        messages: [
          {
            id: 'm1',
            role: 'user',
            text: 'क्या मुझे PM-SYM में शामिल होना चाहिए? / Should I enroll in PM-SYM?'
          },
          {
            id: 'm2',
            role: 'assistant',
            text: "आप PM-SYM के लिए योग्य हैं। आपका योगदान ₹55/महीना होगा। / You're eligible for PM-SYM. Your contribution would be ₹55/month.",
            tradeoff: {
              icon: 'balance',
              headerText: "यहां एक बात ध्यान देने वाली है / Here's something to consider",
              reasoningBody: "आपकी कमाई पिछले 8 हफ्तों में से 3 में स्थिर रही है। 4 और स्थिर हफ्तों का इंतज़ार करने की सलाह है। / Your income has been stable in only 3 of the last 8 weeks. We recommend waiting 4 more stable weeks."
            },
            trustMetadata: {
              basis: "पिछले 4 हफ्तों पर आधारित, 2 दिन पहले अपडेट हुआ / Based on last 4 weeks, updated 2 days ago",
              confidence: "85% confidence / 85% भरोसा"
            },
            disclaimer: "यह जानकारी सामान्य मार्गदर्शन के लिए है। किसी भी योजना में दाखिला लेने से पहले आधिकारिक वेबसाइट पर जाँचें। / This is general guidance — verify on the official website before enrolling."
          }
        ],
        isThinking: true,
        thinkingText: "बजट और योजनाएं देख रहे हैं... / Checking your budget and eligible schemes..."
      });
    }, 500);
  });
};

export const getSuggestedQuestions = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          icon: 'savings',
          hindi: 'इस हफ्ते कितना बचा सकता हूं?',
          english: 'How much can I save this week?'
        },
        {
          icon: 'verified',
          hindi: 'क्या मैं PM-SYM के लिए योग्य हूं?',
          english: 'Am I eligible for PM-SYM?'
        },
        {
          icon: 'security',
          hindi: 'यह मैसेज सुरक्षित है या नहीं?',
          english: 'Is this message safe?'
        },
        {
          icon: 'real-estate-agent',
          hindi: 'मेरा किराया इस महीने कैसे मैनेज करूं?',
          english: 'How do I manage rent this month?'
        }
      ]);
    }, 0);
  });
};

