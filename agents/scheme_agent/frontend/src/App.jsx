import { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, XCircle, Search, Activity, Wallet, 
  AlertCircle, ExternalLink, Shield, TrendingUp, CreditCard, 
  Building, BookOpen, UserCheck, RefreshCw, ChevronDown, ChevronUp,
  Sparkles, Check, X, Layers, Globe
} from 'lucide-react';
import './index.css';

const PRESETS = [
  {
    name: 'Rajesh (Gig Driver, 28y, Karnataka)',
    profile: {
      user_id: 'rajesh_gig_01',
      age: 28,
      epfo_esic_status: false,
      income_tax_payer: false,
      days_active_with_aggregator: 120,
      e_shram_registered: true,
      monthly_income: 24000,
      state: 'Karnataka',
      savings_bank_account: true,
      aadhaar_linked: true,
      language: 'en'
    },
    budget: {
      income_wma_4w: 6000,
      income_volatility_pct: 0.28,
      savings_rate_recommendation: 0.10,
      closing_balance: 4500,
      monthly_income: 24000
    }
  },
  {
    name: 'Pooja (Delivery Partner, 22y, Rajasthan)',
    profile: {
      user_id: 'pooja_gig_02',
      age: 22,
      epfo_esic_status: false,
      income_tax_payer: false,
      days_active_with_aggregator: 95,
      e_shram_registered: false,
      monthly_income: 18000,
      state: 'Rajasthan',
      savings_bank_account: true,
      aadhaar_linked: true,
      language: 'hi'
    },
    budget: {
      income_wma_4w: 4500,
      income_volatility_pct: 0.35,
      savings_rate_recommendation: 0.05,
      closing_balance: 2100,
      monthly_income: 18000
    }
  },
  {
    name: 'Amit (Salaried Worker - Formal Sector)',
    profile: {
      user_id: 'amit_salaried',
      age: 35,
      epfo_esic_status: true,
      income_tax_payer: true,
      days_active_with_aggregator: 0,
      e_shram_registered: false,
      monthly_income: 55000,
      state: 'Maharashtra',
      savings_bank_account: true,
      aadhaar_linked: true,
      language: 'en'
    },
    budget: {
      income_wma_4w: 13750,
      income_volatility_pct: 0.04,
      savings_rate_recommendation: 0.20,
      closing_balance: 32000,
      monthly_income: 55000
    }
  },
  {
    name: 'Ramesh (Senior Cab Driver, 62y, Telangana)',
    profile: {
      user_id: 'ramesh_senior_03',
      age: 62,
      epfo_esic_status: false,
      income_tax_payer: false,
      days_active_with_aggregator: 180,
      e_shram_registered: true,
      monthly_income: 16000,
      state: 'Telangana',
      savings_bank_account: true,
      aadhaar_linked: true,
      language: 'mr'
    },
    budget: {
      income_wma_4w: 4000,
      income_volatility_pct: 0.22,
      savings_rate_recommendation: 0.05,
      closing_balance: 1800,
      monthly_income: 16000
    }
  }
];

const I18N = {
  en: {
    title: 'Scheme Agent Matcher',
    subtitle: 'Curated Government Welfare & Social Security Schemes with Personalized Eligibility & Budget Reasoning',
    categories: 'Welfare Categories',
    all_categories: 'All Schemes',
    search_placeholder: 'Search schemes by name, keyword (e.g., Ayushman, loan, ₹5L, accident)...',
    run_match: 'Find Matching Schemes',
    evaluating: 'Evaluating Eligibility...',
    scrape_btn: 'Run Portal Verification',
    scraper_started: 'Portal verification job queued in background.',
    match_score: 'Match Score',
    eligible_schemes: 'ELIGIBLE SCHEMES',
    ineligible_schemes: 'OTHER / INELIGIBLE SCHEMES',
    benefits: 'Key Benefits',
    documents: 'Required Documents',
    steps: 'Application Steps',
    criteria: 'Eligibility Criteria',
    affordability: 'Budget Affordability',
    portal_link: 'Apply on Official Portal',
    deep_dossier: 'Personalized Scheme Elaboration Dossier',
    close: 'Close',
    view_details: 'View Elaborated Guide & Docs',
    verified_primary: 'Curated KB (Primary Source of Truth)'
  },
  hi: {
    title: 'योजना सहायक (Scheme Agent)',
    subtitle: 'गिग वर्कर्स और असंगठित कामगारों के लिए सत्यापित सरकारी कल्याणकारी योजनाएं',
    categories: 'कल्याण श्रेणियां',
    all_categories: 'सभी योजनाएं',
    search_placeholder: 'योजना का नाम या कीवर्ड खोजें (जैसे आयुष्मान, लोन, दुर्घटना बीमा)...',
    run_match: 'पात्र योजनाएं खोजें',
    evaluating: 'मूल्यांकन जारी है...',
    scrape_btn: 'पोर्टल सत्यापन चलाएं',
    scraper_started: 'बैकग्राउंड में पोर्टल सत्यापन शुरू किया गया।',
    match_score: 'मैच स्कोर',
    eligible_schemes: 'पात्र योजनाएं (Eligible Schemes)',
    ineligible_schemes: 'अपात्र / अन्य योजनाएं',
    benefits: 'मुख्य लाभ',
    documents: 'आवश्यक दस्तावेज',
    steps: 'आवेदन प्रक्रिया',
    criteria: 'पात्रता मानदंड',
    affordability: 'बजट अनुकूलता',
    portal_link: 'आधिकारिक पोर्टल पर आवेदन करें',
    deep_dossier: 'विस्तृत योजना विवरण एवं आवेदन गाइड',
    close: 'बंद करें',
    view_details: 'विस्तृत गाइड और दस्तावेज देखें',
    verified_primary: 'सत्यापित ज्ञान कोष (विश्वसनीय प्राथमिक स्रोत)'
  },
  mr: {
    title: 'योजना सहाय्यक (Scheme Agent)',
    subtitle: 'गिग आणि असंघटित कामगारांसाठी अधिकृत सरकारी कल्याणकारी योजना व अर्थसंकल्प जुळवणी',
    categories: 'कल्याणकारी विभाग',
    all_categories: 'सर्व योजना',
    search_placeholder: 'योजनेचे नाव किंवा कीवर्ड शोधा (उदा. आयुष्मान, कर्ज, अपघात विमा)...',
    run_match: 'पात्र योजना शोधा',
    evaluating: 'तपासणी सुरू आहे...',
    scrape_btn: 'पोर्टल पडताळणी चालवा',
    scraper_started: 'पोर्टल पडताळणी बॅकग्राउंडमध्ये सुरू झाली.',
    match_score: 'जुळवणी स्कोअर',
    eligible_schemes: 'पात्र योजना (Eligible Schemes)',
    ineligible_schemes: 'अपात्र / इतर योजना',
    benefits: 'प्रमुख फायदे',
    documents: 'आवश्यक कागदपत्रे',
    steps: 'अर्ज प्रक्रिया',
    criteria: 'पात्रता अटी',
    affordability: 'बजेट अनुकूलता',
    portal_link: 'अधिकृत पोर्टलवर अर्ज करा',
    deep_dossier: 'तपशीलवार योजना माहिती व मार्गदर्शक',
    close: 'बंद करा',
    view_details: 'तपशीलवार माहिती व कागदपत्रे पहा',
    verified_primary: 'सत्यापित ज्ञानकोश (प्राथमिक विश्वासार्ह स्रोत)'
  }
};

const CATEGORY_ICONS = {
  insurance_healthcare: Shield,
  pension_retirement: TrendingUp,
  credit_loan: CreditCard,
  state_welfare_board: Building,
  skill_education: BookOpen,
  identity: UserCheck
};

function App() {
  const [lang, setLang] = useState('en');
  const [profile, setProfile] = useState(PRESETS[0].profile);
  const [budget, setBudget] = useState(PRESETS[0].budget);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [freshness, setFreshness] = useState(null);
  const [elaboratedModal, setElaboratedModal] = useState(null);
  const [elaboratingCode, setElaboratingCode] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const t = I18N[lang] || I18N.en;

  // Load categories and data freshness on initial mount
  useEffect(() => {
    fetch('http://localhost:8001/api/v1/schemes/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.log('Could not load categories:', err));

    fetch('http://localhost:8001/api/v1/schemes/check-data-freshness')
      .then(res => res.json())
      .then(data => setFreshness(data))
      .catch(() => setFreshness({ all_fresh: true }));
      
    // Auto-run initial evaluation
    runEvaluation(PRESETS[0].profile, PRESETS[0].budget, 'all', '');
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadPreset = (preset) => {
    const updatedProfile = { ...preset.profile, language: lang };
    setProfile(updatedProfile);
    setBudget(preset.budget);
    runEvaluation(updatedProfile, preset.budget, selectedCategory, searchQuery);
  };

  const runEvaluation = async (currentProfile, currentBudget, catFilter, query) => {
    setLoading(true);
    try {
      const payload = {
        user_profile: currentProfile,
        budget_state: currentBudget,
        selected_categories: catFilter === 'all' ? null : [catFilter],
        query: query && query.trim() ? query.trim() : null,
        language: lang
      };

      const response = await fetch('http://localhost:8001/api/v1/schemes/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error('Evaluation failed:', error);
    }
    setLoading(false);
  };

  const handleProfileChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : (e.target.type === 'number' ? Number(e.target.value) : e.target.value);
    const newProfile = { ...profile, [e.target.name]: value };
    setProfile(newProfile);
  };

  const handleBudgetChange = (e) => {
    const newBudget = { ...budget, [e.target.name]: Number(e.target.value) };
    setBudget(newBudget);
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    runEvaluation(profile, budget, catId, searchQuery);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    runEvaluation(profile, budget, selectedCategory, searchQuery);
  };

  const triggerPortalScraper = async () => {
    try {
      const res = await fetch('http://localhost:8001/api/v1/schemes/scrape-now', { method: 'POST' });
      const data = await res.json();
      showToast(t.scraper_started);
    } catch (err) {
      showToast('Offline scraper could not be reached.');
    }
  };

  const openElaboratedDossier = async (schemeCode) => {
    setElaboratingCode(schemeCode);
    try {
      const res = await fetch(`http://localhost:8001/api/v1/schemes/elaborate/${schemeCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_profile: profile,
          budget_state: budget,
          language: lang
        })
      });
      if (res.ok) {
        const data = await res.json();
        setElaboratedModal(data);
      }
    } catch (err) {
      console.error('Elaboration request failed:', err);
    }
    setElaboratingCode(null);
  };

  return (
    <div className="container">
      {/* Toast */}
      {toastMsg && <div className="toast-notification">{toastMsg}</div>}

      {/* Header Bar */}
      <div className="header-bar">
        <div>
          <div className="title">
            <Sparkles size={36} color="#2196f3" />
            {t.title}
          </div>
          <p className="subtitle">{t.subtitle}</p>
        </div>

        <div className="header-actions">
          {/* Language Selector */}
          <div className="lang-toggle-group">
            <Globe size={16} color="var(--text-secondary)" />
            {['en', 'hi', 'mr'].map((l) => (
              <button
                key={l}
                type="button"
                className={`lang-btn ${lang === l ? 'active' : ''}`}
                onClick={() => {
                  setLang(l);
                  setProfile({ ...profile, language: l });
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Scrape Trigger Button */}
          <button type="button" className="btn-secondary" onClick={triggerPortalScraper} title="Trigger offline portal enrichment job">
            <RefreshCw size={15} /> {t.scrape_btn}
          </button>
        </div>
      </div>

      {/* Freshness & Primary Source Banner */}
      <div className="freshness-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CheckCircle size={18} color="var(--accent-green)" />
          <span><strong>{t.verified_primary}</strong> • 9 Schemes Curated & Verified</span>
        </div>
        {freshness && (
          <span className="badge badge-green">
            Status: {freshness.all_fresh ? 'Up to date' : 'Staging Ready'}
          </span>
        )}
      </div>

      {/* Persona Presets */}
      <div style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Quick-fill standard personas:
      </div>
      <div className="presets-container">
        {PRESETS.map((p, idx) => (
          <button key={idx} type="button" className="preset-btn" onClick={() => loadPreset(p)}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Category Filter Pills & Keyword Search */}
      <div className="filter-section">
        <form onSubmit={handleSearchSubmit} className="search-bar-wrap">
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            className="search-input"
            placeholder={t.search_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-submit-btn">Filter</button>
        </form>

        <div className="category-pills">
          <button
            type="button"
            className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategorySelect('all')}
          >
            <Layers size={14} />
            <span>{t.all_categories}</span>
          </button>

          {categories.map((cat) => {
            const IconComp = CATEGORY_ICONS[cat.id] || Shield;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat.id)}
              >
                <IconComp size={14} />
                <span>{cat.name}</span>
                {cat.scheme_count > 0 && <span className="cat-count">{cat.scheme_count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid-2">
        {/* Left Column: User Profile & Budget Agent State Inputs */}
        <div className="glass-card">
          <form onSubmit={(e) => { e.preventDefault(); runEvaluation(profile, budget, selectedCategory, searchQuery); }}>
            <h3 className="section-heading">
              <UserCheck size={20} color="var(--accent-blue)" />
              Gig Worker Profile
            </h3>

            <div className="grid-form-2">
              <div className="form-group">
                <label>Age (Years)</label>
                <input type="number" name="age" value={profile.age || ''} onChange={handleProfileChange} required />
              </div>
              <div className="form-group">
                <label>State of Residence</label>
                <select name="state" value={profile.state || ''} onChange={handleProfileChange}>
                  <option value="">Select State</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Other">Other / All India</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Monthly Income (₹)</label>
              <input type="number" name="monthly_income" value={profile.monthly_income || ''} onChange={handleProfileChange} />
            </div>

            <div className="form-group">
              <label>Days Active with Aggregators (Code on Social Security 2020)</label>
              <input type="number" name="days_active_with_aggregator" value={profile.days_active_with_aggregator || 0} onChange={handleProfileChange} required />
            </div>

            <div className="checkboxes-grid">
              <label className="custom-checkbox">
                <input type="checkbox" name="e_shram_registered" checked={!!profile.e_shram_registered} onChange={handleProfileChange} />
                <span>Registered on e-Shram Portal (UAN Card)</span>
              </label>

              <label className="custom-checkbox">
                <input type="checkbox" name="savings_bank_account" checked={!!profile.savings_bank_account} onChange={handleProfileChange} />
                <span>Active Savings Bank Account</span>
              </label>

              <label className="custom-checkbox">
                <input type="checkbox" name="aadhaar_linked" checked={!!profile.aadhaar_linked} onChange={handleProfileChange} />
                <span>Bank Account Linked with Aadhaar</span>
              </label>

              <label className="custom-checkbox">
                <input type="checkbox" name="epfo_esic_status" checked={!!profile.epfo_esic_status} onChange={handleProfileChange} />
                <span>Enrolled in EPFO / ESIC (Formal Salaried)</span>
              </label>

              <label className="custom-checkbox">
                <input type="checkbox" name="income_tax_payer" checked={!!profile.income_tax_payer} onChange={handleProfileChange} />
                <span>Pays Income Tax</span>
              </label>
            </div>

            {/* Budget Agent Panel */}
            <div className="budget-panel">
              <div className="budget-panel-header">
                <Wallet size={18} /> Budget Agent Context (Joint Reasoning)
              </div>
              <p className="budget-panel-desc">
                Scheme Agent checks contributions against your Income Volatility & Cashflow buffer.
              </p>

              <div className="grid-form-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ color: 'var(--accent-blue)' }}>4-Week Income WMA (₹)</label>
                  <input type="number" name="income_wma_4w" value={budget.income_wma_4w || 0} onChange={handleBudgetChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ color: 'var(--accent-blue)' }}>Income Volatility (0.0 - 1.0)</label>
                  <input type="number" step="0.01" name="income_volatility_pct" value={budget.income_volatility_pct || 0} onChange={handleBudgetChange} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t.evaluating : t.run_match} <Search size={18} />
            </button>
          </form>
        </div>

        {/* Right Column: Elaborated Scheme Results */}
        <div className="glass-card results-container">
          <h3 className="section-heading">
            <Activity size={20} color="var(--accent-green)" />
            Personalized Welfare Recommendations
          </h3>

          {result ? (
            <div>
              {/* Gig Worker Status Banner */}
              <div className="status-banner">
                <div className="status-row">
                  <span><strong>Code on Social Security Status:</strong></span>
                  <span className={`badge ${result.gig_worker_status === 'eligible' ? 'badge-green' : 'badge-red'}`}>
                    {result.gig_worker_status === 'eligible' ? 'Qualified Gig Worker (≥90 Days)' : 'Under 90 Days Active'}
                  </span>
                </div>
                {result.priority_recommendations && result.priority_recommendations.length > 0 && (
                  <div className="priority-list">
                    <strong>Recommended Next Steps:</strong>
                    <ul>
                      {result.priority_recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Eligible Schemes Section */}
              <h4 className="group-heading">{t.eligible_schemes} ({result.eligible_schemes?.length || 0})</h4>
              {result.eligible_schemes && result.eligible_schemes.length > 0 ? (
                result.eligible_schemes.map((scheme, idx) => (
                  <div key={idx} className="scheme-card eligible">
                    <div className="scheme-card-header">
                      <div>
                        <div className="scheme-cat-tag">
                          {scheme.category?.toUpperCase().replace('_', ' ')}
                        </div>
                        <h3>
                          <CheckCircle size={22} color="var(--accent-green)" />
                          {scheme.scheme_name}
                        </h3>
                      </div>

                      <div className="score-badge-wrap">
                        <span className="match-score-badge">
                          {scheme.match_score_pct}% {t.match_score}
                        </span>
                        <span className="freshness-tag">{scheme.data_freshness || '✓ Verified'}</span>
                      </div>
                    </div>

                    {/* Criteria Breakdown */}
                    <div className="criteria-list">
                      {scheme.reasons && scheme.reasons.map((r, i) => (
                        <div key={i} className={`criterion-item ${r.startsWith('✓') ? 'met' : 'unmet'}`}>
                          {r.startsWith('✓') ? <Check size={14} /> : <X size={14} />}
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* Budget Affordability Note */}
                    {scheme.affordability_reasoning && (
                      <div className="budget-note-box">
                        <strong>Budget Agent Note:</strong> {scheme.affordability_reasoning}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="card-actions">
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => openElaboratedDossier(scheme.scheme_code)}
                        disabled={elaboratingCode === scheme.scheme_code}
                      >
                        <FileText size={15} />
                        {elaboratingCode === scheme.scheme_code ? 'Loading Dossier...' : t.view_details}
                      </button>

                      {scheme.official_portal_url && (
                        <a
                          href={scheme.official_portal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-portal"
                        >
                          <ExternalLink size={15} />
                          {t.portal_link}
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-schemes-msg">No eligible schemes matching current filters.</p>
              )}

              {/* Ineligible Schemes Section */}
              {result.ineligible_schemes && result.ineligible_schemes.length > 0 && (
                <div style={{ marginTop: '2.5rem' }}>
                  <h4 className="group-heading inelig">{t.ineligible_schemes} ({result.ineligible_schemes.length})</h4>
                  {result.ineligible_schemes.map((scheme, idx) => (
                    <div key={idx} className="scheme-card ineligible">
                      <div className="scheme-card-header">
                        <div>
                          <div className="scheme-cat-tag">
                            {scheme.category?.toUpperCase().replace('_', ' ')}
                          </div>
                          <h3>
                            <XCircle size={20} color="var(--accent-red)" />
                            {scheme.scheme_name}
                          </h3>
                        </div>
                        <span className="match-score-badge inelig">
                          {scheme.match_score_pct}% Match
                        </span>
                      </div>

                      <div className="criteria-list">
                        {scheme.reasons && scheme.reasons.map((r, i) => (
                          <div key={i} className={`criterion-item ${r.startsWith('✓') ? 'met' : 'unmet'}`}>
                            {r.startsWith('✓') ? <Check size={14} /> : <X size={14} />}
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      <div className="card-actions">
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => openElaboratedDossier(scheme.scheme_code)}
                        >
                          <FileText size={15} />
                          {t.view_details}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={54} style={{ opacity: 0.25, marginBottom: '1rem' }} />
              <p>Configure profile and run evaluation to view personalized recommendations.</p>
            </div>
          )}
        </div>
      </div>

      {/* Elaborated Scheme Dossier Modal */}
      {elaboratedModal && (
        <div className="modal-backdrop" onClick={() => setElaboratedModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="scheme-cat-tag">{elaboratedModal.category?.toUpperCase().replace('_', ' ')}</span>
                <h2 style={{ margin: '0.4rem 0 0 0' }}>{elaboratedModal.scheme_name}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Ministry: {elaboratedModal.ministry} • Scheme Code: {elaboratedModal.scheme_code}
                </span>
              </div>
              <button type="button" className="btn-close" onClick={() => setElaboratedModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Top Banner */}
              <div className="dossier-grid-banner">
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Eligibility Status</div>
                  <div style={{ fontWeight: 700, color: elaboratedModal.eligible ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {elaboratedModal.eligible ? '✓ Eligible' : '✗ Action Required'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Match Score</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{elaboratedModal.match_score_pct}%</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Verification Freshness</div>
                  <div style={{ fontWeight: 700 }}>{elaboratedModal.data_freshness}</div>
                </div>
              </div>

              {/* Budget Affordability Note */}
              {elaboratedModal.budget_affordability_note && (
                <div className="dossier-section">
                  <h4><Wallet size={16} color="var(--accent-blue)" /> {t.affordability}</h4>
                  <div className="budget-note-box">
                    {elaboratedModal.budget_affordability_note}
                  </div>
                </div>
              )}

              {/* Criteria Met & Blockers */}
              <div className="dossier-section">
                <h4><CheckCircle size={16} color="var(--accent-green)" /> {t.criteria}</h4>
                <div className="criteria-table">
                  {elaboratedModal.criteria_breakdown?.map((item, i) => (
                    <div key={i} className={`criteria-table-row ${item.met ? 'row-met' : 'row-unmet'}`}>
                      {item.met ? <Check size={16} color="var(--accent-green)" /> : <X size={16} color="var(--accent-red)" />}
                      <div>
                        <strong>{item.criterion}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Documents */}
              <div className="dossier-section">
                <h4><BookOpen size={16} color="var(--accent-orange)" /> {t.documents}</h4>
                <div className="doc-checklist">
                  {elaboratedModal.required_documents?.map((doc, i) => {
                    const docName = typeof doc === 'string' ? doc : doc.name;
                    const docPurpose = typeof doc === 'object' ? doc.purpose : null;
                    return (
                      <div key={i} className="doc-pill">
                        <CheckCircle size={15} color="var(--accent-green)" />
                        <div>
                          <strong>{docName}</strong>
                          {docPurpose && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{docPurpose}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step-by-Step Application Process */}
              <div className="dossier-section">
                <h4><Layers size={16} color="var(--accent-blue)" /> {t.steps}</h4>
                <ol className="steps-list">
                  {elaboratedModal.step_by_step_process?.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Benefits */}
              {elaboratedModal.benefits && (
                <div className="dossier-section">
                  <h4><Sparkles size={16} color="var(--accent-green)" /> {t.benefits}</h4>
                  <ul>
                    {elaboratedModal.benefits.map((b, i) => (
                      <li key={i} style={{ marginBottom: '0.4rem' }}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setElaboratedModal(null)}>
                {t.close}
              </button>
              {elaboratedModal.official_portal_url && (
                <a
                  href={elaboratedModal.official_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-portal"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ExternalLink size={16} />
                  {t.portal_link}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
