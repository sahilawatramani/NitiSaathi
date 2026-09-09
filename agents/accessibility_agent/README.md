# 🌐 NitiSaathi — Accessibility Agent

The **Accessibility Agent** is an inclusive, multilingual financial translation and accessibility microservice designed for India's gig and informal workforce.

---

## 🎯 Key Features

1. **Google Cloud Translation API Integration**
   - Direct translation into Indic languages (Hindi, Marathi, Bengali, Tamil, Telugu, Kannada, Gujarati, Punjabi, etc.).
   - **Token Preservation Engine**: Automatically protects `₹` currency amounts, percentages, dates, and government scheme abbreviations (`e-Shram`, `PM-SYM`, `PMSBY`, `PMJJBY`, `APY`, `UPI PIN`, `OTP`, `KYC`) from machine translation distortions.
   - **High-Performance In-Memory Cache**: Zero latency on repeated queries.
   - **Offline Fallback Engine**: Rule-based & domain glossary fallback when offline.

2. **Word-to-Word Financial Breakdown**
   - Breaks down sentences token-by-token.
   - Matches terms against a curated **100+ Financial Glossary** for gig workers.
   - Provides simplified meanings, phonetic pronunciations, and gig-context examples.

3. **Number-to-Words & Indian Currency Verbalizer**
   - Converts numeric amounts (e.g., `₹2,450.50`, `₹1,00,000`) into spoken Indian English and Hindi words (`दो हज़ार चार सौ पचास रुपये और पचास पैसे`).
   - Handles Crores, Lakhs, Thousands, Hundreds, and Paise.

4. **Speech & Audio Accessibility (TTS / SSML)**
   - Formats speech synthesizer parameters (pitch, rate) tailored for low literacy and elderly users (default 0.9x speed).
   - Generates SSML with micro-pauses around important amounts and security warnings.

5. **Hinglish Transliteration & Intent Hints**
   - Maps colloquial gig-worker phrases (`"Swiggy ka paisa kab aayega"`, `"hafta"`, `"kharcha"`, `"bachat"`, `"udhaar"`, `"dhokhadhadi"`) to standard Devanagari and detects domain intent hints (Budget, Scheme, Fraud, Literacy).

6. **Accessibility Profile & UI Accommodations**
   - Generates CSS styling tokens (font scaling, high-contrast themes, color-blindness filters).
   - Provides ARIA accessibility tags for screen readers.

---

## 🚀 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/accessibility/health` | Service health, Google API status & cache stats |
| `POST` | `/api/v1/accessibility/translate` | Full text translation with token preservation |
| `POST` | `/api/v1/accessibility/word-to-word` | Word-by-word alignment with glossary definitions |
| `GET` | `/api/v1/accessibility/glossary` | Search or list curated financial terms |
| `GET` | `/api/v1/accessibility/glossary/{term_id}` | Detailed info for a specific term |
| `POST` | `/api/v1/accessibility/number-to-words` | Convert ₹ amounts to spoken words in Hindi/English |
| `POST` | `/api/v1/accessibility/tts-config` | Generate SSML and Web Speech API configuration |
| `POST` | `/api/v1/accessibility/transliterate` | Transliterate Hinglish to Devanagari |
| `POST` | `/api/v1/accessibility/profile/adapt-ui` | Generate UI styling tokens for user accessibility profile |
| `POST` | `/api/v1/accessibility/cache/clear` | Clear translation memory cache |

---

## 💻 Running the Service

```powershell
# From project root:
uvicorn agents.accessibility_agent.main:app --reload --port 8005
```

Interactive documentation:
- **Swagger UI:** `http://127.0.0.1:8005/docs`
- **ReDoc:** `http://127.0.0.1:8005/redoc`
