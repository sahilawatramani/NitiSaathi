# nitisaathi: AI-Powered Multi-Agent Financial Assistant for Gig & Informal Workers

## 1. Introduction
**1.1 Purpose**
The purpose of this document is to define the functional and non-functional requirements for the AI-powered financial assistant tailored for gig workers and informal sector employees. It serves as a blueprint for the development team and a reference for stakeholders for the Nomura KakushIN 2026 event.

**1.2 Scope of the SRS**
The system is an AI assistant providing budgeting tools, scheme recommendations, and fraud alerts. It is designed primarily for gig workers (delivery partners, drivers, etc.) with variable incomes. It will feature text and voice inputs, multilingual support (Hindi, English, etc.), and a proactive nudge system. It explicitly excludes direct financial transactions (e.g., money transfers).

**1.3 Definitions, Acronyms, and Abbreviations**
*   **AI:** Artificial Intelligence
*   **NLP:** Natural Language Processing
*   **ASR:** Automatic Speech Recognition (for voice input)
*   **LLM:** Large Language Model
*   **RAG:** Retrieval-Augmented Generation (for scheme data)
*   **API:** Application Programming Interface
*   **Gig Worker:** An independent contractor or freelancer (e.g., delivery driver).
*   **FinAssist:** Automated transaction aggregation API for financial data ingestion.
*   **DPDP:** Digital Personal Data Protection (Act, 2023)

**1.4 References**
*   Nomura KakushIN 2026 Problem Statement.
*   Relevant government portals (e.g., e-Shram).
*   API documentation for AI models (e.g., OpenAI, Gemini, FinAssist).
*   Code on Social Security 2020 & DPDP Rules 2025.

**1.5 Overview**
The rest of this document outlines the overall description of the system, followed by specific functional and non-functional requirements, external interface requirements, and core use cases.

## 2. Problem Statement
**2.1 Base Problem Statement**
Develop an AI-powered, multi-agent financial assistant that bridges the gap between financial access and financial literacy by delivering personalized financial guidance, intelligent budgeting, and accessibility-first support for users across diverse socio-economic backgrounds.

**2.2 Refined Problem Statement**
India's gig and platform workforce is projected to grow from roughly 7.7 million workers in 2023 to 23.5 million by 2030, yet this group sits outside traditional financial-planning tools built for salaried users with fixed monthly payslips. They face three compounding problems: irregular, unpredictable income that breaks standard budgeting formulas; low awareness of the specific welfare schemes they do qualify for (as opposed to schemes designed for salaried or farming populations); and disproportionate exposure to UPI-based fraud due to high transaction frequency and low digital-safety literacy. nitisaathi is a multi-agent AI system that addresses all three for this one persona first, with accessibility/voice as a planned extension.

## 3. Objectives of the Project
| # | Objective | Measure |
| :--- | :--- | :--- |
| O1 | Build a working budgeting agent that integrates with FinAssist to model irregular income using rolling-window cash flow forecasting | Seamlessly syncs transaction data and handles income variance of ±40% month-to-month without requiring a fixed salary field |
| O2 | Build a scheme-eligibility agent scoped to gig-worker-relevant schemes | ≥90% accuracy on a test set of eligibility questions for e-Shram, PM-SYM, PMJJBY, PMSBY, APY, and applicable state gig-worker welfare boards |
| O3 | Build a fraud-guard agent tuned to UPI scam patterns affecting this group | Correctly flags ≥85% of known scam patterns (fake KYC calls, screen-share requests, fake QR overlays, task-based job scams) in a labeled test set |
| O4 | Ship a functioning demo with all 5 agents live before the presentation round | Demo runs end-to-end without manual intervention |
| O5 (stretch) | Validate ASR reliability in target regional language | ≥80% transcription accuracy under noisy/accented test conditions by Week 4 |

## 4. Description of the Proposed Solution

**4.1 Vision Statement**
To become the first point of digital financial contact for India's gig workforce — the app a delivery partner or driver checks before they check their earnings — by making budgeting, government scheme access, and fraud protection as native to irregular income as a paycheck app is to a fixed one.

**4.2 Target Persona (Flagship)**
"Rajesh" — gig/platform worker (delivery, ride-hailing, or similar), variable weekly/monthly income, primary financial stress points: unpredictable cash flow, confusion about which government scheme applies to him (not a farmer, not salaried), and exposure to UPI fraud due to high daily transaction volume. 

**4.3 Scope**
*In scope (MVP — build fully):*
*   Literacy Agent, Budget Agent, Scheme Agent, Fraud Guard, Nudge Agent — all tuned specifically to gig-worker financial behavior
*   Text + basic voice input (Hindi/English minimum, regional language stretch)
*   Scheme knowledge base: e-Shram, PM-SYM, PMJJBY, PMSBY, Atal Pension Yojana, and the relevant state gig-worker welfare board for your demo state
*   Data privacy layer aligned to DPDP Act 2023 baseline principles

*Explicitly out of scope for MVP (future-compatible stubs only):*
*   Full salaried-persona pipeline (Priya)
*   Full farming-persona pipeline (Kisan) — PM-KISAN, KCC, UDD knowledge base
*   Full accessibility-persona pipeline (Divya) — stretch goal per your own scoping decision
*   Real money movement / actual fund transfers (advisory-only system, not a payments product)
*   Multi-language support beyond 2–3 languages for MVP

**4.4 Success Metrics**
*   Functional demo covering full user journey: onboarding → budget forecast → scheme match → fraud alert → proactive nudge
*   Faculty mentor sign-off on SRS + design docs before build sprint starts
*   Panel-ready defense of every architecture choice (this is what the doc set is for)

**4.5 Assumptions & Constraints**
*   Government scheme APIs may not be publicly accessible — team will need to build a maintained knowledge base rather than a live API integration for MVP (flag this explicitly to the panel rather than pretending live integration exists)
*   ASR reliability is unproven until Week 1 prototype test — accessibility mode is gated on this result
*   Team has access to LLM API credits (Gemini Flash referenced in your diagram) — confirm quota covers dev + demo load
*   DPDP Rules 2025 compliance is on an 18-month phased timeline with full compliance expected by 13 May 2027 — you don't need production-grade compliance for a hackathon MVP, but the panel will expect you to know the framework and show your design respects its core principles

## 5. Literature Review
**5.1 Purpose**
Establish what already exists — government infrastructure, commercial fintech apps, and the regulatory environment — and pinpoint the specific gap nitisaathi fills. This is the document that answers the panel's inevitable "why hasn't someone built this already."

**5.2 Government Scheme Landscape (relevant to flagship persona)**
*   **e-Shram (foundational registry):** Launched in 2021, e-Shram is India's central database for unorganised workers, and by late 2025 had over 31 crore registered workers, including more than five lakh gig and platform workers. Gig and platform delivery/driver partners are explicitly eligible provided they are not separately registered under EPFO or paying income tax, and in December 2024 the government launched a dedicated Aggregator Module to onboard platform workers through their employers, with 12 major aggregators including Zomato, Swiggy, Ola, Uber, Blinkit, Amazon, Rapido, Zepto and Urban Company onboarded by early 2026.
*   **A significant legal shift just happened:** the Code on Social Security, 2020 came into effect on 21 November 2025 and formally defines "gig workers" and "platform workers" in Indian law for the first time, entitling them to accident insurance, health and maternity cover, and old-age protection. Draft rules released in December 2025 propose eligibility after 90 days of engagement with one aggregator, or 120 days across multiple platforms in a financial year. This is directly relevant to your Scheme Agent's eligibility logic — it should be built around this rule, not older assumptions.
*   **PM-SYM:** e-Shram-registered workers get streamlined access to the Pradhan Mantri Shram Yogi Maan-dhan pension, which provides ₹3,000/month pension after age 60 for workers who contribute ₹55–₹200/month starting before age 40.
*   **PMSBY:** Provides ₹2 lakh accident cover; free in the first year after registration, then a ₹20/year premium is auto-debited annually from year two onward — a genuinely useful nudge-agent trigger, since coverage silently lapses if the account balance is insufficient on the debit date.
*   **State-level welfare boards:** Rajasthan was the first state to pass gig-worker legislation, the Rajasthan Platform Based Gig Workers (Registration and Welfare) Act, passed 24 July 2023, which established a welfare board and a monthly welfare cess paid by aggregators into a dedicated fund. Since then, Karnataka, Bihar, and Jharkhand all passed similar laws in August 2025, with Karnataka's law incorporating and improving on Rajasthan's provisions; Telangana passed its own version in 2026. Notably, Karnataka's law is currently being challenged in the Karnataka High Court by food-delivery and quick-commerce platforms, though the court has not stayed it — a live example you can cite to show the panel you understand this space is legally dynamic, not static.
*   **Sizing the problem:** India's gig economy engaged an estimated 7.7 million workers in 2023 and is projected to reach 23.5 million by 2030, with this segment structurally excluded from traditional labour protections like ESIC and EPF — this is your "why now."

**5.3 Existing Fintech / Financial Literacy Apps — Competitive Landscape**
| App | What it does | Gap for gig workers |
| :--- | :--- | :--- |
| Jupiter | Neobank with AI-driven "Pots" auto-savings and spending insights | Built around predictable income patterns, not variable gig income |
| Fi Money | Similar neobank/budgeting positioning to Jupiter | Same salaried-income assumption |
| Jar | Micro-savings app that rounds up UPI transactions and auto-invests spare change | Passive savings tool, no scheme guidance or fraud coaching |
| PhonePe / Paytm | Dominant UPI payment rails, not advisory tools | No budgeting intelligence or scheme-matching layer at all |
| Richify / ET Money | AI-driven tax/investment consolidators | Aimed at users who already have formal income and investable surplus |

*The gap: every major Indian fintech app in this space is architected around a stable, documented, formal income stream. None combine irregular-income budgeting, gig-specific scheme eligibility, and gig-targeted fraud detection into one advisory layer.*

**5.4 UPI Fraud Landscape (justifies the Fraud Guard agent)**
UPI fraud has grown sharply alongside adoption: government data shows ₹805 crore lost to UPI-linked fraud across 10.64 lakh incidents in the first eight months of FY26, following ₹981 crore across 12.64 lakh incidents in FY24-25. Independent tracking shows CERT-In recorded a 300% increase in UPI-related fraud complaints between 2023 and 2025. The scam patterns most relevant to your persona include fake bank/KYC-update calls that trick victims into installing screen-sharing apps, fake QR-code stickers pasted over legitimate shop QR codes to redirect payments, and task-based work-from-home scams that specifically target students and people newly entering the workforce with promises of easy per-task payouts — this last pattern is a near-perfect match for gig-worker fraud exposure and should anchor your Fraud Guard's core detection logic.

**5.5 Regulatory Landscape**
The DPDP Rules 2025 were notified on 13 November 2025, rolled out in phases with full compliance expected by 13 May 2027, and require data fiduciaries to obtain consent that is free, specific, informed, and revocable. Penalties are steep — up to ₹250 crore for failing to implement reasonable security safeguards, and ₹200 crore for failing to notify a data breach — which is exactly the kind of number that makes a panel sit up when you cite it unprompted, because it shows you did the compliance homework rather than hand-waving it. For a fintech-adjacent system handling KYC-like data, the same data flows that satisfy RBI KYC requirements are now subject to an overlapping DPDP compliance layer with its own consent, retention, and data-rights obligations.

**5.6 Academic and Technical Literature Review Table**
| # | Title (Authors, Year) | Full URL | Category | Summary | Gap Identified | How nitisaathi Addresses It |
|---|---|---|---|---|---|---|
| 1 | An AI-Powered Personal Finance Assistant: Enhancing Financial Literacy and Management (Pawar/Agarwal et al., 2024-25) | https://www.researchgate.net/publication/381563265_An_AI-Powered_Personal_Finance_Assistant_Enhancing_Financial_Literacy_and_Management | Literacy + Budget | Proposed ML/NLP assistant for expense tracking, budgeting, investment advice, financial education | Single-agent, monolithic design; no multi-agent orchestration; no fraud/scheme layer; English-only | nitisaathi splits these into specialized agents (literacy, budget, fraud, scheme) coordinated via LangGraph, with multilingual support |
| 2 | Multilingual Conversational AI for Financial Assistance: Bridging Language Barriers in Indian FinTech (Hazarika et al., CIKM'25, 2025) | https://arxiv.org/pdf/2512.01439 | Orchestration + Voice | Multi-agent (language classifier + orchestrator + tools) for Hinglish financial advisory; 41% task-completion gain | Handles only Hindi-English code-mixing; investment-advisory focus only, not full financial-companion scope | nitisaathi extends this orchestration pattern across a full agent suite (budget, scheme, fraud) beyond just investment queries |
| 3 | AI-enhanced bilingual banking assistant (Bhatia & Khetarpaul, Sci Rep, 2025) | https://www.nature.com/articles/s41598-025-22569-z | Voice/Literacy | Privacy-first bilingual (Eng/Hindi/Hinglish) banking chatbot using Mixtral; 87% success rate | Supports only Hindi+English; no transactions; no fraud/scheme/budget agents | nitisaathi's Voice layer targets 22-language coverage via Bhashini |
| 4 | NavaNiti: an AI-Powered Inclusive Platform for Financial Literacy, Budget Planning, Scam Awareness (Biyani et al., 2026) | https://www.researchgate.net/publication/403886246_NavaNiti_an_AI-Powered_Inclusive_Platform_for_Financial_Literacy_Budget_Planning_and_Scam_Awareness | Literacy + Budget + Fraud | Unified gamified platform combining literacy, budgeting, scam-awareness; Gemini-based chatbot | Reactive competitors were prior norm — closest system, but: no scheme-matching agent, no proactive nudge engine, no LangGraph | **Primary comparator.** nitisaathi adds Scheme Agent + proactive Nudge Agent that NavaNiti lacks, using true LangGraph orchestration |
| 5 | Government Welfare Schemes via a Multilingual RAG-Based System (IJRASET) | https://www.ijraset.com/research-paper/government-welfare-schemes-via-a-multilingual-rag-based-system | Scheme Agent | RAG-based multilingual scheme discovery for government welfare programs | Standalone scheme tool, not integrated with budget/fraud/literacy in one app | Scheme Agent design directly informed by this; integrated into nitisaathi's broader orchestration |
| 6 | Enhancing Financial RAG with Agentic AI and Multi-HyDE (Srinivasan et al., IIT Madras, 2025) | https://arxiv.org/pdf/2509.16369 | Literacy Agent (RAG) | Agentic RAG using Multi-HyDE + BM25 hybrid retrieval for financial QA; -15% hallucination | Focused on structured filings (10-K), not conversational coaching for retail users | Multi-HyDE retrieval technique is directly reusable for nitisaathi's Literacy Agent |
| 7 | An end-to-end multi-agent AI system for personal finance (Neural Computing & Applications, 2026) | https://link.springer.com/article/10.1007/s00521-025-11749-7 | Budget + Investment | Synthetic data generation + budget optimization agent + LLM investment advisor | No fraud, scheme agents; not India-specific; no multilingual layer | nitisaathi's Budget Agent design parallels this but adds India-specific scheme/fraud integration |
| 8 | LLM-Based Multi-Agent Orchestration: Survey (2026) | https://doi.org/10.3390/fi18060326 | Orchestration | Compares LangGraph, CrewAI, AutoGen, OpenAI Agents SDK, MetaGPT, DSPy | Generic survey, no finance-domain application | Justifies nitisaathi's LangGraph choice with a citable comparative framework |
| 9 | AI-Enabled System for Simplified Access to Government Schemes (IJEETR, 2026) | https://www.ijeetr.com/index.php/ijeetr/article/download/872/815/1711 | Scheme Agent | React/FastAPI, 4000+ schemes, eligibility wizard + chatbot | Standalone scheme app, no budget/fraud/literacy | Closest tech-stack comparator for Scheme Agent implementation |
| 10 | A Review of Artificial Intelligence for Financial Fraud Detection (MDPI Applied Sciences, 2026) | https://www.mdpi.com/2076-3417/16/4/1931 | Fraud Guard | Comprehensive review of AI/LLM fraud detection incl. XAI, federated learning | Enterprise/institutional focus, not embedded in a consumer companion app | Anchor citation for Fraud Guard Agent's design rationale |
| 11 | BhashaSutra: Unified Survey of Indian NLP Datasets (arXiv 2604.18423) | https://arxiv.org/pdf/2604.18423 | Voice/ASR | Survey covering IndicVoices, IndicSUPERB, MuRIL | Survey only, not deployable system | Single citation to justify 22-language coverage claims |
| 12 | Inclusive AI for People with Disabilities (Clifford Chance) | https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2024/12/inclusive-ai-for-people-with-disabilities--key-considerations.html | Accessibility | Discusses financial-services-specific accessibility gaps | Industry commentary, not empirical study; identifies gap but doesn't solve it | Directly supports the problem-statement framing |
| 13 | ML-Driven Fintech Solutions for Credit Scoring & Financial Inclusion in the Gig Economy (2025) | https://www.academia.edu/143745423/Machine_Learning_Driven_Fintech_Solutions_for_Credit_Scoring_and_Financial_Inclusion_in_the_Gig_Economy | Budget Agent | Explainable, portable credit scoring for gig workers using behavioral+transactional data | Credit-scoring only, not full budgeting/literacy/fraud companion | Informs the Budget Agent's handling of "Gig Variable Income" segment |
| 14 | Transparency by Design: AI Disclosure, Explainability, Trust in Consumer FinTech (MDPI FinTech, 2026) | https://doi.org/10.3390/fintech5020041 | Cross-cutting (XAI) | Narrative synthesis of trust/disclosure literature across robo-advisory, credit, chatbots | Synthesis paper, no new system | Anchor citation for Explainable AI differentiator discussion |
| 15 | Agentic Knowledge Tracing: Multi-Agent LLM for Stealth Assessment of Financial Literacy (arXiv 2606.25358) | https://arxiv.org/pdf/2606.25358 | Literacy Agent | Four domain agents + judge agent; validated on 193 real (K-12) users | Assessment/education context (serious games), not a deployable adult financial companion | Best-fit academic precedent for Literacy Agent's multi-agent structure |

## 6. Gap in the Research, Technology, and Methodology
| Dimension | What exists today | What nitisaathi adds |
| :--- | :--- | :--- |
| Budgeting | Built for fixed salaries | Built for volatile, irregular gig income from day one |
| Scheme guidance | None, or generic government portals | Persona-matched eligibility checking (gig-specific, not farmer/salaried schemes) |
| Fraud protection | Generic bank/NPCI advisories | Pattern detection tuned to scams specifically hitting this user group |
| Proactive support | Reactive apps (user must ask) | Nudge agent initiates before user asks, with a feedback loop to avoid annoying/harmful nudges |
| Compliance posture | Varies widely, often opaque | DPDP-aligned data-minimization designed in from the architecture stage |

## 7. Requirement Analysis

**7.1 Overall Description**

**Product Perspective:**
The assistant is a new, standalone multi-agent system. It is not an extension of an existing product. It will interface with external APIs (like FinAssist) for language processing, transaction syncing, scheme data retrieval, and optionally, SMS/WhatsApp for notifications. It is built on a LangGraph-style orchestration pattern with a central Intent Router and five downstream specialist agents.

**Product Functions:**
*   User Profiling & Onboarding
*   Irregular Income Budgeting (via FinAssist data ingestion)
*   Government Scheme Matching (e-Shram, PM-SYM, etc.)
*   UPI Fraud Detection & Education
*   Financial Literacy (Jargon simplification)
*   Proactive Nudging (Alerts for low balance, expiring schemes)

**User Characteristics:**
Primary users are gig workers. They likely have high smartphone penetration but varying levels of digital and financial literacy. They may prefer voice over text and regional languages over English. They experience high income volatility.

**Constraints:**
*   Must comply with data privacy regulations (e.g., DPDP Act).
*   Performance depends on internet connectivity and third-party API latency.
*   The system provides guidance, not legally binding financial or tax advice.

**Assumptions and Dependencies:**
*   Users have access to a smartphone and internet.
*   Third-party APIs (LLMs, ASR, FinAssist) remain available and affordable.
*   Government scheme data remains relatively stable or is updated via maintainable knowledge bases.

**7.2 Functional Requirements (FR)**
*   **FR-1 Input Layer**
    *   FR-1.1: System shall accept text input in any supported language
    *   FR-1.2: System shall accept voice input and convert to text via ASR
    *   FR-1.3: System shall load user profile (persona, language, income pattern) from storage
*   **FR-2 Preprocessing / Orchestration**
    *   FR-2.1: System shall translate non-English input to a working language before intent classification
    *   FR-2.2: Intent + Persona Classifier shall detect query intent and confirm persona (gig worker for MVP)
    *   FR-2.3: Intent Router shall maintain multi-turn conversation state (checkpointing) so a user doesn't need to repeat context
    *   FR-2.4: If ASR confidence falls below a defined threshold, system shall fall back to a text-input prompt rather than silently failing or guessing.
*   **FR-3 Literacy Agent**
    *   FR-3.1: Shall simplify financial jargon relevant to gig-worker contexts (e.g., explaining "welfare cess," "TDS," "advance tax" in plain language) rather than salaried-context jargon
    *   FR-3.2: Shall respond in the user's selected language
*   **FR-4 Budget Agent**
    *   FR-4.1: Shall integrate with the FinAssist API to automatically ingest and categorize user UPI transaction data.
    *   FR-4.2: Shall accept irregular/non-fixed income inputs seamlessly via FinAssist (not a single monthly salary field).
    *   FR-4.3: Shall generate a rolling cash-flow forecast using a weighted moving average or comparable method suited to variable income.
    *   FR-4.4: Shall calculate a savings-rate recommendation adjusted for income volatility, not a flat percentage.
    *   FR-4.5: Shall flag high-risk spending periods (e.g., weeks with unusually low projected income).
*   **FR-5 Scheme Agent**
    *   FR-5.1: Knowledge base shall cover schemes relevant to gig workers specifically: e-Shram registration, PM-SYM pension, PMJJBY/PMSBY insurance, Atal Pension Yojana, and the applicable state gig-worker welfare board
    *   FR-5.2: Shall run a rule-based eligibility check against user profile fields (age, EPFO/ESIC status, income-tax status) — e.g. e-Shram: age 16–59, unorganised sector, not covered under EPFO/ESIC, not an income-tax payer
    *   FR-5.3: Shall clearly timestamp scheme information with a "last verified" date, since scheme rules are actively evolving
*   **FR-6 Fraud Guard Agent**
    *   FR-6.1: Shall detect patterns matching known UPI scam types affecting this user group: fake KYC-update calls, fake QR-code overlays, task-based/work-from-home advance-fee scams, and unsolicited "refund" requests
    *   FR-6.2: Shall cross-reference RBI lender/SEBI whitelist data before endorsing any third-party financial product mentioned by the user
    *   FR-6.3: Shall never ask the user for their UPI PIN, OTP, or password under any circumstance, and shall explicitly warn the user if anyone else does
*   **FR-7 Nudge Agent**
    *   FR-7.1: Shall generate proactive prompts based on rule-based triggers (e.g., low predicted balance before a known recurring expense)
    *   FR-7.2: Every nudge sent shall be logged with a user-feedback capture point (useful / not useful / harmful) so nudge quality can be measured, not just delivered
    *   FR-7.3: System shall suppress nudges that a feedback loop has flagged as low-value for that trigger type
*   **FR-8 Output Layer**
    *   FR-8.1: Shall render text, dashboard visualization, and voice output
    *   FR-8.2: Every scheme-eligibility or financial recommendation output shall carry a visible advisory disclaimer

**7.3 Non-Functional Requirements (NFR)**
*   **NFR-1 Data Privacy & Security**
    *   Personal data collection shall follow data-minimization: collect only what each agent needs, not a blanket profile
    *   Consent for data use shall be free, specific, informed, and revocable, in line with DPDP Act 2023 principles
    *   User financial data at rest (MongoDB) shall be encrypted; access shall be scoped per agent, not global
    *   System design shall document what data is retained, for how long, and why (even at hackathon-MVP scale)
*   **NFR-2 Performance**
    *   Agent response latency target: under 3 seconds for text queries
    *   ASR fallback (FR-2.4) shall trigger within 1 failed attempt, not multiple silent retries
*   **NFR-3 Reliability**
    *   System shall degrade gracefully: if Scheme Agent knowledge base lookup fails, system shall say so explicitly rather than guessing an eligibility answer
*   **NFR-4 Usability**
    *   Literacy Agent output shall target a reading level appropriate for users with variable formal education — no unexplained financial jargon in first-pass responses
*   **NFR-5 Compliance**
    *   System design shall map each data flow against DPDP Act obligations at a documented level
*   **NFR-6 Localization**
    *   Minimum 2 languages for MVP (English + 1 regional language); 22-language claim should be labeled "target state," not "MVP state," to avoid an unanswerable panel question

**7.4 External Interface Requirements**
*   **User Interface:** Web/mobile chat-style interface + dashboard (React/Vite/Recharts)
*   **Hardware Interface:** Standard smartphone mic for voice input; no specialized hardware
*   **Software Interface:** LLM API (Gemini Flash or equivalent), ASR service, MongoDB, RBI lender registry data source, SEBI whitelist data source
*   **Communication Interface:** HTTPS for all client-server communication; no data transmitted unencrypted

**7.5 Core Use Cases**
| ID | Use Case | Primary Actor |
| :--- | :--- | :--- |
| UC-1 | User asks "how should I save this week" with irregular income | Gig worker |
| UC-2 | User asks "am I eligible for e-Shram / PM-SYM" | Gig worker |
| UC-3 | User forwards a suspicious payment request for a fraud check | Gig worker |
| UC-4 | System proactively nudges user before a predicted low-balance week | System-initiated |
| UC-5 | User asks a jargon-heavy question and receives simplified explanation | Gig worker |
| UC-6 | ASR fails mid-query and system falls back to text | Gig worker |

## 8. Technology Stack
*   **Frontend User Interface:** React.js / Vite (for web/mobile chat UI), Recharts (for Dashboard visualizations).
*   **Backend & Orchestration:** Python, FastAPI, and **LangGraph** (for deterministic multi-agent state routing).
*   **AI / Foundation Models:** 
    *   **Gemini Flash:** Core LLM for reasoning, intent classification, and language generation.
    *   **Bhashini API:** Localized Automatic Speech Recognition (ASR) and Text-to-Speech (TTS) for Indic language support.
*   **Database Layer:** MongoDB (Encrypted at rest) for storing user personas, context checkpoints, and interaction logs.
*   **External APIs:** FinAssist API (for automated transaction fetching), mock RBI/SEBI registries.

## 9. Design (System Architecture & Methodology)
The system utilizes a LangGraph-style orchestration pattern. 
*   **Layer 1 (Input Layer):** Accepts Voice Input, Text Input, and User Profiles. Crucially, it ingests a continuous, automated **FinAssist Data Feed**.
*   **Layer 2 (Preprocessing):** Utilizes the Bhashini ASR/Translation Module to standardize 22 Indian languages into a unified processing format. The Intent + Persona Classifier extracts the core user intent.
*   **Layer 3 (Orchestration Layer):** The Intent Router (LangGraph) determines which specialist agent to invoke. It maintains a "State Graph" (in-memory and LocalStorage) for multi-turn conversations and context checkpointing.
*   **Layer 4 (Specialist Agent Layer):**
    *   *Literacy Agent:* Utilizes system prompt guardrails to simplify financial jargon into gig-context analogies.
    *   *Budget Agent:* Powered by FinAssist transaction data. Uses a Weighted Moving Average (WMA) for cash-flow forecasting.
    *   *Scheme Agent:* RAG-based lookup against a pre-loaded knowledge base of gig-specific schemes.
    *   *Fraud Guard:* Rule engine + LLM classifier to detect UPI scam typologies.
    *   *Nudge Agent (Proactive):* Operates asynchronously, triggering rule-based alerts before the user asks.
*   **Layer 5 (Output Layer):** Browser TTS (Voice output), React-based Dashboard UI (Charts), and Proactive Push Notifications.

## 10. Project Plan with Timeline
| Phase | Duration | Output |
| :--- | :--- | :--- |
| Foundation | Week 1 | Charter, SRS, Literature Survey (this deliverable) |
| Design | Week 2 | HLD, LLD, personas, ASR prototype test |
| Planning | Week 2–3 | WBS/Gantt, Risk Register, RACI |
| Build Sprint 1 | Week 3–5 | Literacy + Budget agents |
| Build Sprint 2 | Week 5–7 | Scheme + Fraud + Nudge agents |
| Compliance + Testing | Week 7–8 | Privacy note, Responsible AI note, test plan execution |
| Pitch Prep | Week 8–9 | Deck, Business Model Canvas, demo rehearsal |
| Final Report | Week 9 | Compiled report in institute template |

## 11. Development & Implementation
Implementation is broken down into modular sprints to ensure the LangGraph orchestration functions independently of the complex agent logic.
1.  **State Management & Routing:** Implementing LangGraph to handle the state object. The state contains `user_context`, `finassist_data`, `chat_history`, and `current_intent`.
2.  **FinAssist Mock Implementation:** For the MVP demo, live API credentials for real bank data may be restricted by sandbox limits. The implementation utilizes precisely structured local JSON payloads that mirror the exact FinAssist data schema, guaranteeing a stable demonstration of automated transaction syncing.
3.  **Agent Tool-Calling:** Agents are implemented as LLMs equipped with specific tools (e.g., the Fraud Guard is given a `search_rbi_database` tool).

## 12. Testing & Debugging
*   **Evaluation Metrics (ROUGE/BLEU):** The Literacy and Scheme agents are evaluated against a baseline of verified financial answers using ROUGE (Recall-Oriented Understudy for Gisting Evaluation) to ensure accurate jargon simplification without altering meaning.
*   **ASR Noise Testing:** The Voice layer (Bhashini) is tested using audio samples with heavy background noise (simulating street conditions) to validate the text-fallback logic.
*   **Deterministic Unit Testing:** The Fraud Guard and Scheme Agent rely heavily on deterministic rules (e.g., Age < 60). These boundaries are strictly unit-tested via pytest to ensure the LLM cannot hallucinate or override hard eligibility criteria.

## 13. Project Outcome
The expected outcome is a fully functional, end-to-end multi-agent demonstration via a web-based chat and dashboard application. The success criteria demand that the system completes a core user journey seamlessly: Onboarding → Automated FinAssist Transaction Sync → Irregular Budget Forecast → Gig-Scheme Matching → Proactive Scam/Nudge Alert.

## 14. Conclusion
nitisaathi proves that true financial inclusion requires more than just translating existing banking apps into regional languages; it requires re-architecting the core logic of financial tools to fit the reality of the informal economy. By utilizing multi-agent orchestration (LangGraph) and automated data ingestion (FinAssist), nitisaathi removes the cognitive and manual burdens of budgeting for gig workers. It successfully shifts financial planning from a reactive chore designed for salaried professionals into a proactive, localized, and highly accessible companion for India's fastest-growing workforce segment.
