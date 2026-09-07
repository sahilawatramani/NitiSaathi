export const getDashboardData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Toggle these to test states:
      // isUrgent = true, hasHistory = true -> Urgent state
      // isUrgent = false, hasHistory = true -> Calm state
      // hasHistory = false -> Empty state
      const isUrgent = true;
      const hasHistory = true;

      const baseData = {
        hasHistory: true,
        savingsRate: {
          percentage: 10,
          current: 2400,
          target: 4800,
          message: 'Based on your recent transactions, you are saving 10% of your total income. This is slightly below the recommended 20% target.'
        },
        expenseBreakdown: {
          total: 21600,
          categories: [
            { name: 'पेट्रोल/Fuel', percentage: 35, color: 'bg-primary' },
            { name: 'खाना/Food', percentage: 25, color: 'bg-secondary' },
            { name: 'किराया/Rent', percentage: 20, color: 'bg-tertiary' },
            { name: 'परिवार को भेजा/Family', percentage: 10, color: 'bg-outline' },
            { name: 'EMI', percentage: 5, color: 'bg-outline-variant' },
            { name: 'अन्य/Other', percentage: 5, color: 'bg-surface-variant' }
          ]
        },
        budgetGoals: [
          { id: 1, title: 'Bike Maintenance', current: 3000, target: 5000, percentage: 60, icon: 'two-wheeler', color: 'secondary' },
          { id: 2, title: 'Emergency Fund', current: 2500, target: 10000, percentage: 25, icon: 'medical-services', color: 'primary' }
        ]
      };

      if (!hasHistory) {
        resolve({
          hasHistory: false
        });
      } else if (isUrgent) {
        resolve({
          ...baseData,
          low_balance_flag: true,
          balance: 10.00,
          incomeForecast: [
            { label: 'W1', value: 2000, isProj: false },
            { label: 'W3', value: 3000, isProj: false },
            { label: 'W5', value: 4000, isProj: false },
            { label: 'W7', value: 3500, isProj: false },
            { label: 'Proj', value: 5100, isProj: true }
          ],
          incomeStats: {
            predictedIncome: 5100,
            predictedSpend: 1200,
            message: 'पिछले 2 महीनों में आपकी कमाई काफी स्थिर रही है / Your income has been fairly steady over the last 2 months'
          },
          goals: [
            { id: 1, title: 'Bike Maintenance', current: 2250, target: 5000, icon: 'two-wheeler', color: 'tertiary' },
            { id: 2, title: 'Emergency Fund', current: 1500, target: 10000, icon: 'home', color: 'secondary', critical: true }
          ],
          urgentAlert: {
            title: 'बैलेंस कम है / Low balance',
            message: 'आपका PMSBY debit 9 दिनों में है, बैलेंस ₹10 है / Your PMSBY debit is in 9 days, balance is ₹10. Please top up to avoid policy lapse.',
            action: 'Top up Now',
            secondaryAction: 'Remind Me'
          },
          health: {
            type: 'urgent',
            status: 'At Risk',
            message: 'Immediate attention required to stabilize savings and secure policies.'
          },
          riskCondition: true,
          causalChainData: {
            title: 'High Expenditure Warning',
            message: "Your expenses in the 'Fuel' category have increased by 40% compared to last week. If this trend continues, you may fall short of your 'Emergency Fund' goal by ₹1,200 this month."
          }
        });
      } else {
        resolve({
          ...baseData,
          low_balance_flag: false,
          balance: 4500.00,
          incomeForecast: [
            { label: 'W1', value: 2000, isProj: false },
            { label: 'W3', value: 3000, isProj: false },
            { label: 'W5', value: 4000, isProj: false },
            { label: 'W7', value: 3500, isProj: false },
            { label: 'Proj', value: 5100, isProj: true }
          ],
          incomeStats: {
            predictedIncome: 5100,
            predictedSpend: 1200,
            message: 'पिछले 2 महीनों में आपकी कमाई काफी स्थिर रही है / Your income has been fairly steady over the last 2 months'
          },
          goals: [
            { id: 1, title: 'Bike Maintenance', current: 2250, target: 5000, icon: 'two-wheeler', color: 'tertiary' },
            { id: 2, title: 'Emergency Fund', current: 1500, target: 10000, icon: 'home', color: 'secondary', critical: true }
          ],
          calmMessage: 'सब कुछ ठीक है / Everything looks good',
          health: {
            type: 'calm',
            status: 'Saver / बचतकर्ता',
            message: "आप बचत में आगे हैं / You're ahead on savings."
          },
          riskCondition: false
        });
      }
    }, 500);
  });
};

export const getCausalRiskChain = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        trigger: {
          titleHindi: 'आपका बैलेंस ₹1,200 है, किराया ₹4,500 का देय है',
          titleEnglish: 'Your balance is ₹1,200, rent of ₹4,500 is due',
          dueInHindi: '6 दिनों में देय',
          dueInEnglish: 'Due in 6 days'
        },
        steps: [
          { stepNum: 1, titleHindi: 'अगर आप किराया नहीं भर पाते', titleEnglish: "If you can't pay rent" },
          { stepNum: 2, titleHindi: 'देर से भुगतान शुल्क', titleEnglish: 'Late fees' },
          { stepNum: 3, titleHindi: 'उधार लेना पड़ सकता है', titleEnglish: 'May need to borrow' }
        ],
        recommendations: [
          {
            id: 1,
            isTopChoice: true,
            titleHindi: 'एक एडवांस का अनुरोध करें',
            titleEnglish: 'Request an Advance',
            icon: 'star'
          },
          {
            id: 2,
            isTopChoice: false,
            titleHindi: 'बचत से निकालें',
            titleEnglish: 'Withdraw from savings',
            icon: 'account-balance'
          },
          {
            id: 3,
            isTopChoice: false,
            titleHindi: 'खर्च कम करें',
            titleEnglish: 'Reduce expenses',
            icon: 'trending-down'
          }
        ]
      });
    }, 300);
  });
};
