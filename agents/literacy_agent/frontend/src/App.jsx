import React, { useState } from 'react';
import { Sparkles, ArrowRight, BookOpen, ShieldAlert, Check, Loader2, RefreshCw } from 'lucide-react';
import './App.css';

function App() {
  const [inputText, setInputText] = useState("Your income_wma_4w is ₹2,800 with coefficient of variation 0.31. You are eligible for PM-SYM. Monthly contribution ₹55.");
  const [literacyLevel, setLiteracyLevel] = useState("low");
  const [hasFinancial, setHasFinancial] = useState(true);
  const [hasScheme, setHasScheme] = useState(true);
  
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRewrite = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Pointing to the standalone Literacy Agent backend on port 8100
      const response = await fetch('http://localhost:8100/literacy/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          literacy_level: literacyLevel,
          has_financial_content: hasFinancial,
          has_scheme_content: hasScheme,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setOutput(data);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to Literacy Agent backend. Is it running on port 8100?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <Sparkles className="header-icon" size={32} />
        <h1>NitiSaathi Literacy Agent</h1>
      </header>

      <main className="main-layout">
        {/* Left Column: Input & Controls */}
        <div className="glass-panel">
          <div className="panel-header">
            <BookOpen size={24} className="header-icon" />
            <h2 className="panel-title">System Output Simulator</h2>
          </div>

          <div className="input-group">
            <label className="label">Raw Agent Output</label>
            <textarea 
              className="textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw financial or scheme text here..."
            />
          </div>

          <div className="input-group">
            <label className="label">Target Literacy Level</label>
            <div className="level-selector">
              {['low', 'medium', 'high'].map(level => (
                <button 
                  key={level}
                  className={`level-btn ${literacyLevel === level ? `active ${level}` : ''}`}
                  onClick={() => setLiteracyLevel(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="label">Content Flags (Triggers Disclaimer)</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={hasFinancial}
                  onChange={(e) => setHasFinancial(e.target.checked)}
                />
                <div className="checkbox-custom">
                  {hasFinancial && <Check size={14} color="white" />}
                </div>
                Contains Financial Advice
              </label>
              
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={hasScheme}
                  onChange={(e) => setHasScheme(e.target.checked)}
                />
                <div className="checkbox-custom">
                  {hasScheme && <Check size={14} color="white" />}
                </div>
                Contains Scheme Recommendation
              </label>
            </div>
          </div>

          <button 
            className="submit-btn"
            onClick={handleRewrite}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="spinner" />
                Rewriting...
              </>
            ) : (
              <>
                Rewrite for User <ArrowRight size={20} />
              </>
            )}
          </button>
          
          {error && (
            <div style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <Sparkles size={24} className="header-icon" style={{ color: 'var(--accent-purple)' }} />
            <h2 className="panel-title">Final User-Facing Message</h2>
          </div>

          <div className="output-content" style={{ flexGrow: 1 }}>
            {isLoading ? (
              <div>
                <div className="loading-skeleton"></div>
                <div className="loading-skeleton"></div>
                <div className="loading-skeleton"></div>
                <div className="loading-skeleton" style={{ width: '40%' }}></div>
              </div>
            ) : output ? (
              <div>
                {/* Splitting text to render disclaimer separately if it exists */}
                {output.rewritten_text.split('---').map((part, index) => {
                  if (index === 1) {
                    return (
                      <div key={index} className="disclaimer-badge">
                        <ShieldAlert size={16} />
                        {part.replace('⚠️ **Disclaimer:**', '').trim()}
                      </div>
                    );
                  }
                  // Render markdown-like bolding simply
                  return (
                    <div key={index} dangerouslySetInnerHTML={{ 
                      __html: part.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
                    }} />
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                <RefreshCw size={48} style={{ opacity: 0.2 }} />
                <p>Click "Rewrite for User" to see the result.</p>
              </div>
            )}
          </div>
          
          {output && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Level Applied:</span> <span style={{ color: 'var(--accent-blue)', textTransform: 'capitalize' }}>{output.literacy_level}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Disclaimer:</span> <span style={{ color: output.disclaimer_added ? 'var(--accent-green)' : 'var(--text-muted)' }}>{output.disclaimer_added ? 'Added' : 'None'}</span></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
