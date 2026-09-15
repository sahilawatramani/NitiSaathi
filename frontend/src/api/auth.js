import { apiFetch, storeToken, clearToken, API_BASE_URL } from './config';

export const register = async (email, password) => {
  const userEmail = email && email.trim() ? email.trim() : `user_${Date.now().toString().slice(-4)}@nitisaathi.demo`;
  const userPassword = password && password.length >= 8 ? password : 'demo_password_123';

  try {
    await apiFetch('/api/auth/signup', { 
      method: 'POST', 
      body: JSON.stringify({ email: userEmail, password: userPassword }) 
    });
  } catch (err) {
    // If email already registered, proceed to login
    if (!err.message?.includes('already registered')) {
      throw err;
    }
  }

  // Log in immediately to get the access token
  const loginData = await login(userEmail, userPassword);
  return loginData;
};

export const login = async (email, password) => {
  const userEmail = email && email.trim() ? email.trim() : 'demo@nitisaathi.demo';
  const userPassword = password && password.length >= 8 ? password : 'demo_password_123';

  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: userPassword })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let msg = 'Login failed';
    if (typeof err.detail === 'string') msg = err.detail;
    else if (Array.isArray(err.detail)) msg = err.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
    throw new Error(msg);
  }
  const data = await res.json();
  if (data.access_token) await storeToken(data.access_token);
  return data;
};

export const logout = async () => {
  await clearToken();
};

export const createSession = login;
export const logoutSession = logout;
