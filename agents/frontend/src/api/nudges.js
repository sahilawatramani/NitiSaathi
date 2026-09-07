export const getRecentNudges = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          type: 'urgent',
          icon: 'account-balance',
          title: 'Low Balance Warning',
          message: 'Your balance is critically low for upcoming auto-debits.',
          time: 'Just now'
        },
        {
          id: 2,
          type: 'warning',
          icon: 'trending-down',
          title: 'Earnings Dip',
          message: 'Earnings down 12% compared to last week.',
          time: '2 hours ago'
        },
        {
          id: 3,
          type: 'info',
          icon: 'verified-user',
          title: 'Scheme Eligible',
          message: 'You qualify for PMJJBY based on your profile.',
          time: 'Yesterday'
        }
      ]);
    }, 500);
  });
};

export const getNudges = async (isEmpty = false) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (isEmpty) {
        resolve([]);
      } else {
        resolve([
          {
            id: 'n1',
            isHighPriority: true,
            tagTitle: 'Urgent Action Required',
            timeAgo: '2 घंटे पहले / 2 hours ago',
            headline: 'PMSBY Insurance Renewal Due',
            bodyHindi: 'आपका प्रधानमंत्री सुरक्षा बीमा योजना (PMSBY) का प्रीमियम ₹20 कल देय है। कृपया सुनिश्चित करें कि आपके बैंक खाते में पर्याप्त राशि है।',
            bodyEnglish: 'Your Pradhan Mantri Suraksha Bima Yojana (PMSBY) premium of ₹20 is due tomorrow. Please ensure you have sufficient balance in your bank account.',
            outcomeHindi: null,
            outcomeEnglish: null
          },
          {
            id: 'n2',
            isHighPriority: false,
            tagTitle: 'Milestone',
            timeAgo: '1 दिन पहले / 1 day ago',
            headline: 'Emergency Fund Target Reached',
            bodyHindi: 'बधाई हो! आपने इस महीने अपने आपातकालीन फंड के लक्ष्य का 50% हासिल कर लिया है। ऐसे ही बचत करते रहें।',
            bodyEnglish: "Congratulations! You've reached 50% of your emergency fund goal this month. Keep saving.",
            outcomeHindi: '✓ आपने अपना लक्ष्य बनाए रखा',
            outcomeEnglish: 'You stayed on track with your goal.'
          }
        ]);
      }
    }, 500);
  });
};
