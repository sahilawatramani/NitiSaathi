import { useState, useRef, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { Send, Sparkles, MessageSquareHeart } from 'lucide-react';
import { sendChatMessage } from '../services/api';
import { useAppContext } from '../context/AppContext';

const formatBotMessage = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, idx) => {
    if (!line.trim()) return <br key={idx} />;
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const parsedLine = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--primary)' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return <div key={idx} style={{ marginBottom: '6px' }}>{parsedLine}</div>;
  });
};

export default function ChatPage() {
  const { chatMessages, setChatMessages } = useAppContext();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleSend = async (overrideText = null) => {
    const textToSubmit = overrideText || input;
    if (!textToSubmit.trim() || loading) return;
    
    setInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: textToSubmit.trim() }]);
    setLoading(true);

    try {
      const res = await sendChatMessage(textToSubmit.trim());
      setChatMessages((prev) => [...prev, { role: 'bot', text: res.data.response }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "I just got a ₹2L yearly bonus. What should I do with it based on my profile?",
    "I'm planning to get married in 2 years. How should I adjust my SIPs?",
    "Should I buy a house on EMI right now with my current income?",
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <h1 className="page-title">Life Event Advisor</h1>
        <p className="page-subtitle">AI-powered, WhatsApp-style financial intelligence</p>
      </div>

      <div className="chat-container">
        
        {/* Quick Prompts */}
        {chatMessages.length === 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 20px 16px 20px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {quickPrompts.map((prompt, i) => (
              <Motion.button 
                key={i} 
                className="btn" 
                style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', whiteSpace: 'nowrap', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: 500 }}
                whileHover={{ scale: 1.05, borderColor: 'var(--primary)', background: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend(prompt)}
              >
                <MessageSquareHeart size={14} style={{ color: 'var(--accent)' }} />
                {prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt}
              </Motion.button>
            ))}
          </div>
        )}

        <div className="chat-messages">
          {chatMessages.map((msg, i) => (
            <Motion.div
              key={i}
              className={`chat-bubble ${msg.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {msg.role === 'bot' ? (
                <div className="markdown-wrapper" style={{ lineHeight: 1.5 }}>{formatBotMessage(msg.text)}</div>
              ) : (
                msg.text
              )}
            </Motion.div>
          ))}
          {loading && (
            <Motion.div className="chat-bubble bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: 'var(--accent)' }} /> Analyzing profile...
              </div>
            </Motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-bar">
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message here..."
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={() => handleSend(null)} disabled={loading || !input.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
