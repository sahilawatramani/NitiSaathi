import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Target, HeartHandshake, TrendingUp, ChevronRight, Activity, Wallet, Shield } from 'lucide-react';
import { saveProfile } from '../services/api';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: 30,
    monthly_income: '',
    monthly_expenses: '',
    monthly_emi: '0',
    current_savings: '',
    has_health_insurance: false,
    target_retirement_age: 60,
    risk_tolerance: 'moderate', // low, moderate, high
    is_couple: false,
    partner_age: '',
    partner_income: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await saveProfile({
        ...formData,
        age: Number(formData.age),
        monthly_income: Number(formData.monthly_income),
        monthly_expenses: Number(formData.monthly_expenses),
        monthly_emi: Number(formData.monthly_emi),
        current_savings: Number(formData.current_savings),
        target_retirement_age: Number(formData.target_retirement_age),
        is_couple: formData.is_couple,
        partner_age: formData.is_couple ? Number(formData.partner_age) : null,
        partner_income: formData.is_couple ? Number(formData.partner_income) : null,
      });
      // Redirect to dashboard where the Health Score will load
      navigate('/');
    } catch (err) {
      console.error(err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Premium Animated Background Layer */}
      <div className="animated-bg" style={{ opacity: 0.8 }} />
      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', opacity: 0.15, filter: 'blur(80px)', top: '-10%', left: '-10%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.1, filter: 'blur(80px)', bottom: '-10%', right: '-10%', pointerEvents: 'none' }} />
      
      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ 
          width: '100%', 
          maxWidth: '600px', 
          background: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(20px)', 
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          borderRadius: '24px', 
          padding: '40px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Financial Blueprint</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Let's build your FIRE plan in 60 seconds.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '4px', width: '24px', borderRadius: '4px', background: i <= step ? 'var(--primary)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <Motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                <Wallet size={20} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Income & Baseline</h2>
            </div>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Current Age</label>
                <input type="number" name="age" className="input" value={formData.age} onChange={handleChange} min="18" max="100" />
              </div>
              <div className="input-group">
                <label>Monthly Take-home Income (₹)</label>
                <input type="number" name="monthly_income" className="input" value={formData.monthly_income} onChange={handleChange} placeholder="e.g. 100000" />
              </div>
            </div>
            <div className="grid-2" style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>Avg. Monthly Expenses (₹)</label>
                <input type="number" name="monthly_expenses" className="input" value={formData.monthly_expenses} onChange={handleChange} placeholder="e.g. 50000" />
              </div>
              <div className="input-group">
                <label>Total Monthly EMI (₹)</label>
                <input type="number" name="monthly_emi" className="input" value={formData.monthly_emi} onChange={handleChange} placeholder="e.g. 15000" />
              </div>
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setFormData(p => ({ ...p, is_couple: !p.is_couple }))}>
                <div>
                  <div style={{ fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HeartHandshake size={18} style={{ color: formData.is_couple ? 'var(--primary)' : 'var(--text-muted)' }} />
                    Plan as a Couple
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Combine incomes for joint FIRE tracking and tax optimization strategies.</div>
                </div>
                <div style={{ position: 'relative', width: '44px', height: '24px', background: formData.is_couple ? 'var(--primary)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', transition: '0.3s' }}>
                  <Motion.div animate={{ x: formData.is_couple ? 22 : 2 }} style={{ position: 'absolute', top: '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%' }} />
                </div>
              </div>
              
              {formData.is_couple && (
                <Motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: '16px' }} style={{ overflow: 'hidden' }}>
                  <div className="grid-2">
                    <div className="input-group">
                      <label>Partner's Age</label>
                      <input type="number" name="partner_age" className="input" value={formData.partner_age} onChange={handleChange} min="18" max="100" />
                    </div>
                    <div className="input-group">
                      <label>Partner's Monthly Income (₹)</label>
                      <input type="number" name="partner_income" className="input" value={formData.partner_income} onChange={handleChange} placeholder="e.g. 80000" />
                    </div>
                  </div>
                </Motion.div>
              )}
            </div>
            
            <button className="btn btn-primary" onClick={nextStep} style={{ width: '100%', marginTop: '32px', padding: '14px', borderRadius: '12px', fontWeight: 600 }} disabled={!formData.monthly_income || !formData.monthly_expenses}>
              Next Step <ChevronRight size={18} />
            </button>
          </Motion.div>
        )}

        {step === 2 && (
          <Motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <Shield size={20} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Savings & Security</h2>
            </div>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label>Current Total Savings/Investments (₹)</label>
              <input type="number" name="current_savings" className="input" value={formData.current_savings} onChange={handleChange} placeholder="FDs, Stocks, EPF, Mutual Funds" />
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setFormData(p => ({ ...p, has_health_insurance: !p.has_health_insurance }))}>
              <div>
                <div style={{ fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: formData.has_health_insurance ? 'var(--success)' : 'var(--text-muted)' }} />
                  Comprehensive Health Insurance
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Do you have private medical cover?</div>
              </div>
              <div style={{ position: 'relative', width: '44px', height: '24px', background: formData.has_health_insurance ? 'var(--success)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', transition: '0.3s' }}>
                <Motion.div animate={{ x: formData.has_health_insurance ? 22 : 2 }} style={{ position: 'absolute', top: '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button className="btn" onClick={prevStep} style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}>Back</button>
              <button className="btn btn-primary" onClick={nextStep} style={{ flex: 2 }} disabled={formData.current_savings === ''}>
                Next Step <ChevronRight size={18} />
              </button>
            </div>
          </Motion.div>
        )}

        {step === 3 && (
          <Motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                <Target size={20} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Goals & Risk</h2>
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Target F.I.R.E Age</label>
              <input type="number" name="target_retirement_age" className="input" value={formData.target_retirement_age} onChange={handleChange} min={formData.age + 1} max="80" />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Age by which you want Financial Independence.</p>
            </div>

            <div className="input-group">
              <label>Investment Risk Tolerance</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {['low', 'moderate', 'high'].map(risk => (
                  <button 
                    key={risk}
                    className={`btn ${formData.risk_tolerance === risk ? 'btn-primary' : ''}`}
                    style={{ flex: 1, padding: '10px 0', background: formData.risk_tolerance !== risk ? 'rgba(255,255,255,0.05)' : undefined }}
                    onClick={() => setFormData(p => ({ ...p, risk_tolerance: risk }))}
                  >
                    {risk.charAt(0).toUpperCase() + risk.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button className="btn" onClick={prevStep} style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} disabled={loading}>Back</button>
              <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none' }} disabled={loading}>
                {loading ? 'Analyzing...' : 'Generate My FIRE Plan'}
              </button>
            </div>
          </Motion.div>
        )}
      </Motion.div>
    </div>
  );
}
