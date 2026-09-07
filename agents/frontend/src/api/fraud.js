export const getFlaggedTransactions = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 't1',
          amount: '₹ 15,000.00',
          merchant: 'Unknown Merchant (Delhi)',
          date: 'Today, 10:42 AM',
          flagTypeHindi: 'असामान्य स्थान',
          flagTypeEnglish: 'Unusual location',
          icon: 'location_off'
        },
        {
          id: 't2',
          amount: '₹ 4,999.00',
          merchant: 'GameCredits.net',
          date: 'Yesterday, 11:20 PM',
          flagTypeHindi: 'असामान्य समय',
          flagTypeEnglish: 'Odd hours',
          icon: 'schedule'
        }
      ]);
    }, 500);
  });
};

export const getFraudCheckResult = async (riskParam) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (riskParam === 'low') {
        resolve({
          riskLevel: 'low',
          headlineHindi: 'यह सुरक्षित लगता है',
          headlineEnglish: 'This looks safe',
          reasonHindi: 'यह मैसेज किसी भी ज्ञात धोखाधड़ी पैटर्न से मेल नहीं खाता।',
          reasonEnglish: 'This message does not match any known scam patterns.'
        });
      } else {
        resolve({
          riskLevel: 'high',
          headlineHindi: 'यह खतरनाक हो सकता है',
          headlineEnglish: 'This could be risky',
          reasonHindi: 'यह मैसेज एक जाना-पहचाना धोखाधड़ी पैटर्न जैसा दिखता है: नकली रिफंड अनुरोध',
          reasonEnglish: 'This message matches a known scam pattern: Fake refund request.'
        });
      }
    }, 500);
  });
};
