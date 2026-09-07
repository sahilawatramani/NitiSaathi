// Mock API for User
export const createUserProfile = async (profileData) => {
  console.log('[Mock User API] createUserProfile called with:', profileData);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, userId: 'mock-user-456' });
    }, 500);
  });
};

export const getUserSettings = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        consent: {
          transactionData: true,
          schemeEligibility: true,
          fraudDetection: true,
          notifications: false,
          monthlyReport: true
        }
      });
    }, 300);
  });
};

export const updateUserSettings = async (newSettings) => {
  console.log('[Mock User API] updateUserSettings called with:', newSettings);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 300);
  });
};
