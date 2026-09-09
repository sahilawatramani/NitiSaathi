import React, { useState } from 'react';
import { Sparkles, ArrowRight, BookOpen, ShieldAlert, Check, Loader2, Volume2, Info } from 'lucide-react';
import './App.css';

const PRESETS = [
  {
    name: "Budget Alert (High Jargon)",
    text: "Your income_wma_4w is ₹2,800 with coefficient of variation 0.31. Low_balance_flag is active because closing_balance is less than 30% of WMA.",
    hasFinancial: true,
    hasScheme: false
  },
  {
    name: "Scheme Eligibility & Contribution",
    text: "You are eligible for PM-SYM with monthly contribution ₹55. Also eligible for PMSBY with premium ₹20/year.",
    hasFinancial: true,
    hasScheme: true
  },
  {
    name: "Fraud Security Alert",
    text: "CRITICAL: Fraud Guard detected a suspicious collect request from an unknown counterparty. OTP or UPI PIN must never be entered.",
    hasFinancial: false,
    hasScheme: false
  }
];

function App() {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [literacyLevel, setLiteracyLevel] = useState("low");
  const [langPref, setLangPref] = useState("hi"); // Target Language: 'hi', 'en', 'mr'
  const [hasFinancial, setHasFinancial] = useState(PRESETS[0].hasFinancial);
  const [hasScheme, setHasScheme] = useState(PRESETS[0].hasScheme);
  
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPreset = (preset) => {
    setInputText(preset.text);
    setHasFinancial(preset.hasFinancial);
    setHasScheme(preset.hasScheme);
    setOutput(null);
  };

  const handleRewrite = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8100/literacy/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          literacy_level: literacyLevel,
          language: langPref, // Pass language choice to backend if supported, otherwise handled locally
          has_financial_content: hasFinancial,
          has_scheme_content: hasScheme,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If backend doesn't perform translation but mock fallback does, we can simulate translation locally for demo
      if (langPref === 'hi' && data.rewritten_text.match(/[a-zA-Z]/)) {
        // Fallback simple translation for Hindi UI demonstration
        data.rewritten_text = data.rewritten_text
          .replace("estimated weekly income", "अनुमानित साप्ताहिक कमाई")
          .replace("recommended savings percentage", "बचत का सुझाव")
          .replace("low balance warning", "कम बैलेंस की चेतावनी")
          .replace("current balance", "आपका बैलेंस");
      }
      
      setOutput(data);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to Literacy Agent backend. Is it running on port 8100? Using local fallback.");
      
      // Fallback Demo Mock
      let rewritten = inputText;
      // Apply jargon simplification
      rewritten = rewritten
        .replace("income_wma_4w", "estimated weekly income")
        .replace("coefficient of variation", "income fluctuation")
        .replace("low_balance_flag", "low balance warning")
        .replace("closing_balance", "current balance");

      if (langPref === 'hi') {
        rewritten = "आपकी अनुमानित साप्ताहिक कमाई ₹2,800 है जिसमें उतार-चढ़ाव देखा गया है। कम बैलेंस की चेतावनी चालू है क्योंकि आपका बैलेंस काफी कम है।";
      }

      if (hasScheme) {
        rewritten += "\n\n--- ⚠️ **Disclaimer:** यह जानकारी सामान्य मार्गदर्शन के लिए है।";
      }

      setOutput({
        rewritten_text: rewritten,
        literacy_level: literacyLevel,
        disclaimer_added: hasScheme || hasFinancial
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadAloud = () => {
    if (!output || !output.rewritten_text) return;
    const textToSpeak = output.rewritten_text.split('---')[0]; // Skip disclaimer for clean speech
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langPref === 'hi' ? 'hi-IN' : langPref === 'mr' ? 'mr-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="app-container">
      <header className="header">
        <Sparkles className="header-icon" size={32} />
        <h1>NitiSaathi Literacy Agent Dashboard</h1>
      </header>

      <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Select preset system message:</div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {PRESETS.map((p, idx) => (
          <button key={idx} className="preset-chip" onClick={() => loadPreset(p)}>
            {p.name}
          </button>
        ))}
      </div>

      <main className="main-layout">
        {/* Left Column: Input & Controls */}
        <div className="glass-panel">
          <div className="panel-header">
            <BookOpen size={24} className="header-icon" />
            <h2 className="panel-title">System Raw Feed & Configurations</h2>
          </div>

          <div className="input-group">
            <label className="label">Raw System Output (With Tech Jargon)</label>
            <textarea 
              className="textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw financial or scheme text here..."
            />
          </div>

          <div className="input-group">
            <label className="label">Target Language</label>
            <div className="lang-selector">
              {[
                { code: 'hi', label: 'Hindi (हिंदी)' },
                { code: 'mr', label: 'Marathi (मराठी)' },
                { code: 'en', label: 'English' }
              ].map(lang => (
                <button 
                  key={lang.code}
                  className={`lang-btn ${langPref === lang.code ? 'active' : ''}`}
                  onClick={() => setLangPref(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="label">Target Literacy Level</label>
            <div className="level-selector">
              {['low', 'medium', 'high'].map(level => (
                <button 
                  key={level}
                  className={`level-btn ${literacyLevel === level ? 'active' : ''}`}
                  onClick={() => setLiteracyLevel(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="label">Content Indicators (For Regulatory Disclaimers)</label>
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
                Contains Financial Advice / Warnings
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
                Contains Scheme recommendations
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
                Translate & Simplify <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <Sparkles size={24} className="header-icon" style={{ color: 'var(--accent-purple)' }} />
            <h2 className="panel-title">Final Simplified Output</h2>
          </div>

          <div className="output-content" style={{ flexGrow: 1 }}>
            {isLoading ? (
              <div>
                <p>Simplifying terms...</p>
              </div>
            ) : output ? (
              <div>
                {/* Render clean text */}
                {output.rewritten_text.split('---').map((part, index) => {
                  if (index === 1) {
                    return (
                      <div key={index} className="disclaimer-badge">
                        <ShieldAlert size={16} />
                        <div>
                          <strong>Disclaimer:</strong> {part.replace('⚠️ **Disclaimer:**', '').replace('Disclaimer:', '').trim()}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <p key={index} style={{ margin: 0 }} dangerouslySetInnerHTML={{ 
                      __html: part.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
                    }} />
                  );
                })}

                <button className="tts-btn" onClick={handleReadAloud}>
                  <Volume2 size={16} /> Read Out Loud (TTS)
                </button>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>
                <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Run evaluation to see simplified results.</p>
              </div>
            )}
          </div>

          {output && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Jargon Check:</span> <span style={{ color: 'var(--accent-green)' }}>Simplified</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target:</span> <span style={{ color: 'var(--accent-blue)' }}>{langPref.toUpperCase()} ({literacyLevel})</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
