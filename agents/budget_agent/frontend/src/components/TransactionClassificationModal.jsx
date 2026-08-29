import { useState } from 'react';
import { X, Loader2, Tag, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { classifyPendingTransaction } from '../services/api';
import { useBudget } from '../context/BudgetContext';
import './TransactionClassificationModal.css';

export default function TransactionClassificationModal() {
  const {
    classifyModal,
    closeClassifyModal,
    updateInsightsFromClassify,
    refreshPending,
    refreshInsights,
  } = useBudget();

  const { open, event } = classifyModal;
  const [selected, setSelected] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open || !event) return null;

  const suggestions = event.suggested_categories || [];
  const predicted = suggestions[0] || 'Miscellaneous';

  const handleClassify = async (category) => {
    const finalCategory = category === 'Others' ? customCategory.trim() : category;
    if (category === 'Others' && !finalCategory) {
      setError('Please enter a custom category');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await classifyPendingTransaction(
        event.id,
        category,
        category === 'Others' ? finalCategory : null,
      );

      // Real-time budget update from inline response
      if (res.data?.budget_state) {
        updateInsightsFromClassify(res.data.budget_state);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelected(null);
        setCustomCategory('');
        closeClassifyModal();
        refreshPending();
        refreshInsights();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Classification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setSelected(null);
    setCustomCategory('');
    setError('');
    closeClassifyModal();
  };

  const formatAmount = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  return (
    <div className="classify-modal-overlay" onClick={handleSkip}>
      <div className="classify-modal" onClick={(e) => e.stopPropagation()}>
        {/* Success state */}
        {success && (
          <div className="classify-success">
            <CheckCircle2 size={48} />
            <p>Classified! Budget updated.</p>
          </div>
        )}

        {!success && (
          <>
            {/* Header */}
            <div className="classify-modal-header">
              <div className="classify-modal-icon">
                <Tag size={20} />
              </div>
              <div>
                <h3>Classify Transaction</h3>
                <p className="classify-subtitle">Categorize to keep your budget accurate</p>
              </div>
              <button className="classify-close" onClick={handleSkip}>
                <X size={18} />
              </button>
            </div>

            {/* Transaction Details */}
            <div className="classify-txn-card">
              <div className="classify-txn-row">
                <span className="classify-txn-merchant">{event.merchant}</span>
                <span className="classify-txn-amount">{formatAmount(event.amount)}</span>
              </div>
              {event.description && (
                <p className="classify-txn-desc">{event.description}</p>
              )}
              <p className="classify-txn-date">
                {new Date(event.txn_date || event.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>

            {/* AI Prediction Badge */}
            <div className="classify-prediction">
              <Sparkles size={14} />
              <span>AI suggests: <strong>{predicted}</strong></span>
              {event.confidence_score && (
                <span className="classify-confidence">
                  {Math.round(event.confidence_score * 100)}% confident
                </span>
              )}
            </div>

            {/* Category Options */}
            <div className="classify-options">
              {suggestions.map((cat) => (
                <button
                  key={cat}
                  className={`classify-option ${selected === cat ? 'selected' : ''} ${cat === predicted ? 'predicted' : ''}`}
                  onClick={() => {
                    setSelected(cat);
                    if (cat !== 'Others') handleClassify(cat);
                  }}
                  disabled={loading}
                >
                  {cat}
                  {cat === predicted && <Sparkles size={12} />}
                </button>
              ))}
            </div>

            {/* Custom Category Input */}
            {selected === 'Others' && (
              <div className="classify-custom">
                <input
                  type="text"
                  placeholder="Enter custom category..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleClassify('Others')}
                  autoFocus
                />
                <button
                  onClick={() => handleClassify('Others')}
                  disabled={loading || !customCategory.trim()}
                >
                  {loading ? <Loader2 size={16} className="spin" /> : 'Save'}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="classify-error">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Skip */}
            <button className="classify-skip" onClick={handleSkip}>
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
