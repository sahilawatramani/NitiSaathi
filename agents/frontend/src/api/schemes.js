export const getSchemes = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 's1',
          name: 'e-Shram',
          status: 'eligible',
          statusLabelHindi: 'योग्य',
          statusLabelEnglish: 'Eligible',
          description: 'National Database for Unorganized Workers offering accidental insurance cover.',
          lastVerified: '1 जुलाई 2026 / 1 July 2026',
          hasBudgetGuidance: false
        },
        {
          id: 'pmsym',
          name: 'PM-SYM',
          status: 'needs_info',
          statusLabelHindi: 'अधिक जानकारी चाहिए',
          statusLabelEnglish: 'Needs more info',
          description: 'Pradhan Mantri Shram Yogi Maan-dhan. Pension scheme for unorganized workers.',
          lastVerified: '1 जुलाई 2026 / 1 July 2026',
          hasBudgetGuidance: true
        },
        {
          id: 's3',
          name: 'PMSBY',
          status: 'eligible',
          statusLabelHindi: 'योग्य',
          statusLabelEnglish: 'Eligible',
          description: 'Pradhan Mantri Suraksha Bima Yojana. Accidental death and disability insurance.',
          lastVerified: '1 जुलाई 2026 / 1 July 2026',
          hasBudgetGuidance: false
        },
        {
          id: 's4',
          name: 'PMJJBY',
          status: 'not_eligible',
          statusLabelHindi: 'योग्य नहीं',
          statusLabelEnglish: 'Not eligible',
          description: 'Pradhan Mantri Jeevan Jyoti Bima Yojana. Life insurance scheme.',
          lastVerified: '1 जुलाई 2026 / 1 July 2026',
          hasBudgetGuidance: false
        },
        {
          id: 's5',
          name: 'APY',
          status: 'needs_info',
          statusLabelHindi: 'अधिक जानकारी चाहिए',
          statusLabelEnglish: 'Needs more info',
          description: 'Atal Pension Yojana. Guaranteed pension scheme for citizens of India.',
          lastVerified: '1 जुलाई 2026 / 1 July 2026',
          hasBudgetGuidance: true
        },
        {
          id: 's6',
          name: 'State Welfare Board',
          status: 'eligible',
          statusLabelHindi: 'योग्य',
          statusLabelEnglish: 'Eligible',
          description: 'State-specific welfare board registration and benefits for gig workers.',
          lastVerified: '1 जुलाई 2026 / 1 July 2026',
          hasBudgetGuidance: false
        }
      ]);
    }, 500);
  });
};

export const getSchemeDetail = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return PM-SYM mock data for now regardless of ID to match the required UI
      resolve({
        id: id,
        name: 'PM-SYM',
        status: 'eligible',
        statusLabelHindi: 'योग्य',
        statusLabelEnglish: 'Eligible',
        lastVerified: '1 जुलाई 2026 / 1 July 2026',
        description: 'Pradhan Mantri Shram Yogi Maandhan (PM-SYM) is a voluntary and contributory pension scheme designed specifically for unorganised workers. It guarantees a minimum assured pension upon reaching the age of 60, providing financial security during retirement years.',
        benefits: {
          amount: '₹3,000/महीना',
          subtext: 'after age 60'
        },
        contribution: {
          amount: '₹55/महीना',
          subtext: 'estimated starting amount'
        },
        budgetGuidance: {
          headerText: 'बजट सलाह / Budget guidance',
          reasoningBody: 'आपकी कमाई पिछले 8 हफ्तों में से 3 में स्थिर रही है। 4 और स्थिर हफ्तों का इंतज़ार करने की सलाह है।\n\nYour income has been stable in only 3 of the last 8 weeks. We recommend waiting 4 more stable weeks.',
          icon: 'balance'
        },
        enrollmentNote: 'nitisaathi सीधे दाखिला नहीं करता / nitisaathi does not enroll you directly. You must visit the official government portal to complete registration.',
        portalUrl: 'https://example.gov.in'
      });
    }, 300);
  });
};
