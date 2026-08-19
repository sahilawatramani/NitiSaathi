import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { login, signup, getMe, resetPassword } from '../services/api';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let token = null;

    try {
      if (isForgotPassword) {
        await resetPassword(email, password);
        toast.success('Password reset successfully! Please sign in.');
        setIsForgotPassword(false);
        setIsLogin(true);
        return;
      }
      if (!isLogin) {
        await signup(email, password);
      }
      const res = await login(email, password);
      token = res.data.access_token;
      localStorage.setItem('token', token);
      const userRes = await getMe();
      loginUser(token, userRes.data);
      navigate('/');
    } catch (err) {
      if (token) {
        localStorage.removeItem('token');
      }
      let errMsg = 'Something went wrong';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map(e => e.msg).join(', ');
        } else {
          errMsg = err.response.data.detail;
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="animated-bg" />
      <div className="auth-container">
        <Motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-logo">FinAssist AI</div>
          <p className="auth-subtitle">Your AI-powered personal finance assistant</p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 14px', borderRadius: '8px', color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ paddingLeft: '36px' }} required />
              </div>
            </div>
            <div className="input-group">
              <label>{isForgotPassword ? 'New Password' : 'Password'}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingLeft: '36px' }} required />
              </div>
            </div>
            {!isForgotPassword && isLogin && (
              <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); setError(''); }} style={{ fontSize: '13px', color: 'var(--primary)' }}>
                  Forgot Password?
                </a>
              </div>
            )}
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              ) : isForgotPassword ? (
                <>Reset Password</>
              ) : isLogin ? (
                <><LogIn size={18} /> Sign In</>
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>

          <div className="auth-footer">
            {isForgotPassword ? (
              <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotPassword(false); setIsLogin(true); setError(''); }}>
                Back to Sign in
              </a>
            ) : (
              <>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setError(''); }}>
                  {isLogin ? 'Sign up' : 'Sign in'}
                </a>
              </>
            )}
          </div>
        </Motion.div>
      </div>
    </>
  );
}
