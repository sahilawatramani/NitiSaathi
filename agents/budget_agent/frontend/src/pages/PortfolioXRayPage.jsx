import { useState, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { UploadCloud, FileText, AlertTriangle, CheckCircle, PieChart, Info, RefreshCw, Layers, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';

export default function PortfolioXRayPage() {
  const { 
    isXRayLoading, setIsXRayLoading, 
    xrayComplete, setXrayComplete,
    portfolioData, setPortfolioData 
  } = useAppContext();
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef(null);

  const mockUploadSequence = [
    "Parsing CAMS/KFintech Statement...",
    "Reconstructing Historical NAVs...",
    "Calculating True XIRR...",
    "Detecting Underlying Stock Overlaps...",
    "Analyzing Expense Ratio Drag...",
    "Generating AI Recommendations..."
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsXRayLoading(true);
    setXrayComplete(false);
    setProgressMsg("Uploading & Parsing CAS Statement...");
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { uploadPortfolio } = await import('../services/api');
      const res = await uploadPortfolio(formData);
      
      // Simulate multiple steps for UI wow-factor, but real processing is already done
      setProgressMsg("Calculating True XIRR...");
      setTimeout(() => setProgressMsg("Detecting Underlying Stock Overlaps..."), 600);
      setTimeout(() => setProgressMsg("Analyzing Expense Ratio Drag..."), 1200);
      setTimeout(() => setProgressMsg("Generating AI Recommendations..."), 1800);
      
      setTimeout(() => {
        setPortfolioData(res.data.data);
        setIsXRayLoading(false);
        setXrayComplete(true);
      }, 2500);
      
    } catch (err) {
      console.error(err);
      alert("Failed to parse statement. Please ensure it's a valid CSV CAS format.");
      setIsXRayLoading(false);
    }
  };

  const mockChartData = [
    { year: '2020', value: 200000, invested: 200000 },
    { year: '2021', value: 450000, invested: 350000 },
    { year: '2022', value: 680000, invested: 500000 },
    { year: '2023', value: 890000, invested: 650000 },
    { year: '2024', value: 1245000, invested: 800000 },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Mutual Fund Portfolio X-Ray</h1>
        <p className="page-subtitle">Upload your CAMS/KFintech statement for an instant deep-dive analysis</p>
      </div>

      {!isXRayLoading && !xrayComplete && (
        <Motion.div 
          className="card" 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px', border: '2px dashed var(--border)', background: 'var(--bg-dark)' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', cursor: 'pointer' }}>
            <UploadCloud size={40} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Drop your Consolidated Account Statement (CAS)</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
            We support CAMS, KFintech, and NSDL statements in PDF or Excel format. Your data is encrypted and never stored.
          </p>
          <button className="btn btn-primary btn-lg"><FileText size={18} /> Select File</button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf,.xlsx,.csv" onChange={handleFileUpload} />
        </Motion.div>
      )}

      {isXRayLoading && (
        <Motion.div 
          className="card" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px', background: 'var(--bg-dark)' }}
        >
          <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '4px', marginBottom: '24px', borderColor: 'rgba(59, 130, 246, 0.2)', borderTopColor: 'var(--primary)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>{progressMsg}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>This will take less than 10 seconds...</p>
        </Motion.div>
      )}

      {xrayComplete && (
        <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Top Level Stats */}
          <div className="stat-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card blue">
              <div className="stat-icon blue"><PieChart size={20} /></div>
              <div className="stat-label">Total Portfolio Value</div>
              <div className="stat-value">₹{(portfolioData?.currentValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon green"><TrendingUp size={20} /></div>
              <div className="stat-label">True XIRR (Returns)</div>
              <div className="stat-value">{portfolioData?.xirr || 0}%</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon red"><PieChart size={20} /></div>
              <div className="stat-label">Total Amount Invested</div>
              <div className="stat-value">₹{(portfolioData?.totalInvested || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-icon yellow"><Layers size={20} /></div>
              <div className="stat-label">Schemes Analyzed</div>
              <div className="stat-value" style={{ color: 'var(--text-main)' }}>{portfolioData?.schemes_count || 0}</div>
            </div>
          </div>

          <div className="grid-2">
            {/* Growth Chart */}
            <div className="card">
              <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Invested vs Current Value</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={mockChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} tickLine={false} axisLine={false} width={40} />
                  <RechartsTooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="invested" stroke="#64748B" strokeDasharray="5 5" fill="none" name="Amount Invested" />
                  <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="Current Value" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* AI Warning & Action Plan */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <RefreshCw size={20} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '16px' }}>AI Portfolio Action Plan</h3>
              </div>

              {portfolioData?.insights?.map((insight, idx) => (
                <div key={idx} style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: `1px solid rgba(${insight.status === 'warning' ? '245, 158, 11' : insight.status === 'danger' ? '239, 68, 68' : '16, 185, 129'}, 0.2)`, 
                  background: `rgba(${insight.status === 'warning' ? '245, 158, 11' : insight.status === 'danger' ? '239, 68, 68' : '16, 185, 129'}, 0.05)`, 
                  display: 'flex', 
                  gap: '12px', 
                  marginTop: idx === portfolioData.insights.length - 1 ? 'auto' : 0
                }}>
                  {insight.status === 'warning' ? (
                    <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                  ) : insight.status === 'danger' ? (
                    <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                  )}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h4 style={{ color: `var(--${insight.status})`, fontSize: '14px', fontWeight: 600 }}>{insight.title}</h4>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>{insight.value}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {insight.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Motion.div>
      )}
    </div>
  );
}
