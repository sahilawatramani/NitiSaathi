import { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity, Search, Info } from 'lucide-react';
import './index.css';

const PRESETS = [
  {
    name: 'Fake KYC Call (PIN Request)',
    amount: '0',
    counterparty: 'Unknown Caller',
    message_text: 'Dear customer, your UPI account will be blocked today. Please complete KYC via this link and enter your UPI PIN to verify.'
  },
  {
    name: 'Fake Refund Scam',
    amount: '5000',
    counterparty: 'Rahul Kumar',
    message_text: 'I accidentally sent you 5000. Please approve this collect request to refund me.'
  },
  {
    name: 'Task-Based Scam',
    amount: '1000',
    counterparty: 'HR Telegram',
    message_text: 'Pay 1000 registration fee to start data entry job. Earn 5000 daily.'
  },
  {
    name: 'Safe Payout',
    amount: '840',
    counterparty: 'Swiggy Payout',
    message_text: 'Weekly payout credited.'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' or 'lender'
  
  // Transaction State
  const [transaction, setTransaction] = useState({
    amount: '',
    counterparty: '',
    description: '',
    type: 'debit',
    message_text: ''
  });
  const [result, setResult] = useState(null);
  
  // Lender State
  const [lenderName, setLenderName] = useState('');
  const [lenderResult, setLenderResult] = useState(null);
  
  const [loading, setLoading] = useState(false);

  const loadPreset = (preset) => {
    setTransaction({
      amount: preset.amount,
      counterparty: preset.counterparty,
      description: '',
      type: 'debit',
      message_text: preset.message_text
    });
    setResult(null);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // First check for PIN/OTP in message
      const pinCheck = await fetch('http://localhost:8002/api/v1/fraud-guard/check-pin-otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transaction.message_text }),
      }).then(r => r.json()).catch(() => null);

      if (pinCheck && pinCheck.contains_pin_otp_request) {
        setResult({
          is_suspicious: true,
          severity: 'CRITICAL',
          alert_message: pinCheck.alert_message,
          fraud_type: 'PIN_OTP_REQUEST',
          action_required: pinCheck.action_required
        });
        setLoading(false);
        return;
      }

      // Then standard detect
      const response = await fetch('http://localhost:8002/api/v1/fraud-guard/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: transaction,
          user_history: { recent_counterparties: [], average_transaction_amount: 500 },
          check_description: transaction.message_text
        }),
      }).catch(() => null);

      if (response) {
        const data = await response.json();
        setResult(data);
      } else {
        // Fallback demo mock
        setResult({
          is_suspicious: transaction.message_text.toLowerCase().includes('refund'),
          severity: transaction.message_text.toLowerCase().includes('refund') ? 'high' : 'low',
          alert_message: transaction.message_text.toLowerCase().includes('refund') ? 'Fake refund pattern detected.' : 'Transaction looks safe.',
          fraud_type: transaction.message_text.toLowerCase().includes('refund') ? 'fake_refund' : 'none'
        });
      }
    } catch (error) {
      console.error(error);
    }
    
    setLoading(false);
  };

  const handleLenderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8002/api/v1/fraud-guard/check-lender/${encodeURIComponent(lenderName)}`).catch(() => null);
      if (response) {
        const data = await response.json();
        setLenderResult(data);
      } else {
        // Fallback
        setLenderResult({
          is_registered: lenderName.toLowerCase().includes('bank'),
          entity_name: lenderName,
          warning: lenderName.toLowerCase().includes('bank') ? null : 'Entity not found in RBI whitelist. Do not take loans from unregistered apps.'
        });
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="title">
        <ShieldAlert size={40} color="#ff4b4b" />
        Fraud Guard Simulator
      </div>
      <p className="subtitle">Detecting UPI scam patterns targeting gig workers in real-time.</p>

      <div className="tabs">
        <button className={`tab ${activeTab === 'analyze' ? 'active' : ''}`} onClick={() => setActiveTab('analyze')}>
          Transaction Analyzer
        </button>
        <button className={`tab ${activeTab === 'lender' ? 'active' : ''}`} onClick={() => setActiveTab('lender')}>
          RBI Lender Check
        </button>
      </div>

      {activeTab === 'analyze' && (
        <>
          <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Try a preset scenario:</div>
          <div className="presets-container">
            {PRESETS.map((p, idx) => (
              <button key={idx} className="preset-btn" onClick={() => loadPreset(p)}>
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid-2">
            <div className="glass-card">
              <h3>Transaction Input</h3>
              <form onSubmit={handleTransactionSubmit}>
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input type="number" name="amount" value={transaction.amount} onChange={(e) => setTransaction({...transaction, amount: e.target.value})} placeholder="e.g. 500" required />
                </div>
                <div className="form-group">
                  <label>Counterparty</label>
                  <input type="text" name="counterparty" value={transaction.counterparty} onChange={(e) => setTransaction({...transaction, counterparty: e.target.value})} placeholder="e.g. Unknown User" required />
                </div>
                <div className="form-group">
                  <label>Message / SMS Text (Optional)</label>
                  <textarea name="message_text" value={transaction.message_text} onChange={(e) => setTransaction({...transaction, message_text: e.target.value})} placeholder="e.g. Please enter your UPI PIN" rows={3}></textarea>
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? 'Analyzing...' : 'Analyze Transaction'} <Activity size={18} />
                </button>
              </form>
            </div>

            <div className="glass-card">
              <h3>Rich Analysis Card</h3>
              {result ? (
                <div className={`result-box severity-${result.severity || 'low'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    {result.is_suspicious ? <AlertTriangle size={32} color="#ff4b4b" /> : <ShieldCheck size={32} color="#4caf50" />}
                    <h2 style={{ margin: 0 }}>
                      {result.severity === 'CRITICAL' ? 'CRITICAL SCAM DETECTED' : (result.is_suspicious ? 'Suspicious Activity Detected' : 'No Threat Detected')}
                    </h2>
                  </div>
                  
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Alert Message</p>
                    <p style={{ margin: 0, fontWeight: 500 }}>{result.alert_message}</p>
                  </div>

                  {result.action_required && (
                    <p style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>⚠️ Action: {result.action_required}</p>
                  )}
                  
                  {(result.fraud_type && result.fraud_type !== 'none') && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Detected Pattern</p>
                      <span className="badge badge-red">{result.fraud_type}</span>
                    </div>
                  )}

                  {result.rules_triggered && result.rules_triggered.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Signals Triggered</p>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                        {result.rules_triggered.map((rule, idx) => <li key={idx}>{rule}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem' }}>
                  <ShieldAlert size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Submit a transaction to see detailed fraud analysis.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'lender' && (
        <div className="grid-2">
          <div className="glass-card">
            <h3>Check Loan Provider</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Gig workers are often targeted by unregistered loan apps. Enter a company name to check if they are an RBI-registered lender.
            </p>
            <form onSubmit={handleLenderSubmit}>
              <div className="form-group">
                <label>Company / Lender Name</label>
                <input type="text" value={lenderName} onChange={(e) => setLenderName(e.target.value)} placeholder="e.g. Bajaj Finance" required />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Checking...' : 'Check RBI Whitelist'} <Search size={18} />
              </button>
            </form>
          </div>

          <div className="glass-card">
            <h3>Verification Result</h3>
            {lenderResult ? (
              <div className={`result-box ${lenderResult.is_registered ? 'severity-safe' : 'severity-high'}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  {lenderResult.is_registered ? <ShieldCheck size={32} color="#4caf50" /> : <AlertTriangle size={32} color="#ff4b4b" />}
                  <h2 style={{ margin: 0 }}>
                    {lenderResult.is_registered ? 'Registered Lender' : 'UNREGISTERED LENDER'}
                  </h2>
                </div>
                <p><strong>Entity:</strong> {lenderResult.entity_name}</p>
                {lenderResult.warning && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,75,75,0.1)', borderRadius: '8px', color: '#ff4b4b' }}>
                    <Info size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/>
                    {lenderResult.warning}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem' }}>
                <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Search for a lender to view their RBI registration status.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
