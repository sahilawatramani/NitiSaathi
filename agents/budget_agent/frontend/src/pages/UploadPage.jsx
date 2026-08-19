import { useState, useRef, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader, MessageSquareText, Sparkles, Brain, ShieldCheck, Database } from 'lucide-react';
import { ingestSmsTransaction, uploadCSV } from '../services/api';
import { useAppContext } from '../context/AppContext';

export default function UploadPage() {
  const { uploadState, setUploadState, smsState, setSmsState } = useAppContext();
  const { file, uploading, result, error } = uploadState;
  const { text: smsText, sender: smsSender, loading: smsLoading, result: smsResult, error: smsError } = smsState;
  
  const [dragging, setDragging] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const inputRef = useRef();

  const aiSteps = [
    { icon: <Upload size={16} />, label: 'Parsing CSV file...' },
    { icon: <Brain size={16} />, label: 'AI classifying expenses (batched)...' },
    { icon: <ShieldCheck size={16} />, label: 'Analyzing tax deductions (80C/80D)...' },
    { icon: <Database size={16} />, label: 'Saving to your financial profile...' },
  ];

  useEffect(() => {
    if (!uploading) { setProgressStep(0); return; }
    const interval = setInterval(() => {
      setProgressStep(prev => (prev < aiSteps.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, [uploading]);

  const handleFile = (f) => {
    if (f && f.name.endsWith('.csv')) {
      setUploadState(prev => ({ ...prev, file: f, error: '', result: null }));
    } else {
      setUploadState(prev => ({ ...prev, error: 'Please upload a .csv file' }));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadState(prev => ({ ...prev, uploading: true, error: '' }));
    try {
      const res = await uploadCSV(file);
      setUploadState(prev => ({ ...prev, result: res.data }));
    } catch (err) {
      setUploadState(prev => ({ ...prev, error: err.response?.data?.detail || 'Upload failed' }));
    } finally {
      setUploadState(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleSmsIngest = async () => {
    if (!smsText.trim()) {
      setSmsState(prev => ({ ...prev, error: 'Please paste a bank SMS first' }));
      return;
    }

    setSmsState(prev => ({ ...prev, loading: true, error: '', result: null }));
    try {
      const res = await ingestSmsTransaction(smsText.trim(), smsSender.trim() || 'BANK-SMS');
      setSmsState(prev => ({ ...prev, result: res.data }));
    } catch (err) {
      setSmsState(prev => ({ ...prev, error: err.response?.data?.detail || 'SMS ingestion failed' }));
    } finally {
      setSmsState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Upload Transactions</h1>
        <p className="page-subtitle">Import your bank statement or transaction CSV</p>
      </div>

      <Motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div
          className={`upload-zone ${dragging ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
        >
          <div className="upload-icon"><Upload size={48} /></div>
          <h3 style={{ marginBottom: '8px' }}>{file ? file.name : 'Drop your CSV file here'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB — Ready to upload` : 'or click to browse files'}
          </p>
          <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
        </div>

        {error && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '14px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {file && !result && (
          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-primary btn-lg" onClick={handleUpload} disabled={uploading} style={{ width: '100%', justifyContent: 'center' }}>
              {uploading ? <><Loader size={18} className="spin" /> Analyzing with AI...</> : <><Upload size={18} /> Upload & Analyze with AI</>}
            </button>
            {uploading && (
              <Motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginTop: '16px', padding: '16px', background: 'rgba(99,102,241,0.05)', border: '1px solid var(--border)', borderRadius: '16px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {aiSteps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: i <= progressStep ? 1 : 0.3, transition: 'opacity 0.5s' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: i < progressStep ? 'var(--success)' : i === progressStep ? 'var(--primary)' : 'var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '12px', transition: 'background 0.5s',
                        boxShadow: i === progressStep ? '0 0 10px var(--primary-glow)' : 'none'
                      }}>
                        {i < progressStep ? <CheckCircle size={14} /> : step.icon}
                      </div>
                      <span style={{ fontSize: '13px', color: i === progressStep ? '#fff' : 'var(--text-muted)', fontWeight: i === progressStep ? 600 : 400 }}>
                        {step.label}
                      </span>
                      {i === progressStep && <Sparkles size={12} style={{ color: 'var(--accent)', animation: 'spin 2s linear infinite' }} />}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>⚡ AI processes all transactions in just 2 batched calls for maximum speed</p>
              </Motion.div>
            )}
          </div>
        )}
      </Motion.div>

      <Motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <MessageSquareText size={18} />
          <h3 style={{ fontSize: '16px' }}>WhatsApp-Style Transaction Parser</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '14px' }}>
          Paste any bank debit SMS or UPI notification — FinAssist instantly classifies and saves it to your financial profile.
        </p>

        <input
          className="input"
          value={smsSender}
          onChange={(e) => setSmsState(prev => ({ ...prev, sender: e.target.value }))}
          placeholder="Sender ID (for example HDFCBK or SBIINB)"
          style={{ marginBottom: '10px' }}
        />

        <textarea
          className="input"
          value={smsText}
          onChange={(e) => setSmsState(prev => ({ ...prev, text: e.target.value }))}
          placeholder={"Example: Your A/C XXXX1234 is debited by INR 245.50 at SWIGGY on 24-03-2026 18:22."}
          rows={4}
          style={{ resize: 'vertical' }}
        />

        {smsError && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '14px' }}>
            <AlertCircle size={16} /> {smsError}
          </div>
        )}

        <button className="btn btn-primary btn-lg" onClick={handleSmsIngest} disabled={smsLoading} style={{ width: '100%', justifyContent: 'center', marginTop: '14px' }}>
          {smsLoading ? <><Loader size={18} className="spin" /> Parsing SMS...</> : <><MessageSquareText size={18} /> Parse & Save Transaction</>}
        </button>

        {smsResult && (
          <div style={{ marginTop: '14px', padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: `1px solid ${smsResult.status === 'saved' ? 'rgba(16,185,129,0.3)' : 'var(--border)'}` }}>
            {smsResult.status === 'saved' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                  <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '14px' }}>{smsResult.message}</span>
                </div>
                {smsResult.transaction && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                    <div style={{ padding: '10px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Merchant</div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{smsResult.transaction.merchant}</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Amount</div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>₹{Number(smsResult.transaction.amount).toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Category</div>
                      <div><span className="badge badge-blue">{smsResult.transaction.category}</span></div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Tax Deductible</div>
                      <div>
                        {smsResult.transaction.is_tax_deductible 
                          ? <span className="badge badge-green">{smsResult.transaction.tax_category}</span>
                          : <span className="badge badge-red">No</span>
                        }
                      </div>
                    </div>
                  </div>
                )}
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>✅ This transaction is now included in your Analytics, Tax Report, and Dashboard.</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '14px', marginBottom: '4px' }}><strong>Status:</strong> {smsResult.status}</p>
                {smsResult.reason && <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{smsResult.reason}</p>}
              </>
            )}
          </div>
        )}
      </Motion.div>

      <AnimatePresence>
        {result && (
          <Motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
              <h3 style={{ fontSize: '16px' }}>Successfully processed {result.length} transactions</h3>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Date</th><th>Merchant</th><th>Amount</th><th>Category</th><th>Tax Deductible</th></tr></thead>
                <tbody>
                  {result.slice(0, 20).map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.merchant}</td>
                      <td>₹{t.amount.toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-blue">{t.category}</span></td>
                      <td>{t.is_tax_deductible ? <span className="badge badge-green">Yes</span> : <span className="badge badge-red">No</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.length > 20 && <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px' }}>Showing first 20 of {result.length} transactions</p>}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
