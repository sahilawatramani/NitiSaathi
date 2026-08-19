import { useState, useEffect } from 'react';
import { getMe } from '../services/api';
import AuthContext from './authContextObject';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');
    if (!token) {
       Promise.resolve().then(() => { if(mounted) setLoading(false); });
      return () => {
        mounted = false;
      };
    }

    getMe()
      .then((res) => {
        if (mounted) setUser(res.data);
      })
       .catch(() => {
         if (mounted) localStorage.removeItem('token');
       })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
     setLoading(false);  // Set loading to false after successful login
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
     setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
