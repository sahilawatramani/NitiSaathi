// Mock API for Auth
export const createSession = async (userData) => {
  console.log('[Mock Auth API] createSession called with:', userData);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, token: 'mock-jwt-token-12345', user: userData });
    }, 500);
  });
};

export const logoutSession = async () => {
  console.log('[Mock Auth API] logoutSession called');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 200);
  });
};
