# 💰 FinAssist AI: Premium Financial Intelligence Platform

FinAssist is a state-of-the-art, AI-powered personal financial assistant designed to provide deep insights into your spending habits, investment portfolio, and long-term financial health. Built with a modern tech stack and focusing on a premium user experience, FinAssist transcends traditional budgeting apps by leveraging LLMs for intelligent analysis and planning.

---

## ✨ Key Features

### 🧠 AI Financial Advisor (RAG-powered)
- **Intelligent Chat**: Natural language interactions to ask about your finances.
- **Local-First AI**: Support for **Ollama** allows you to run models like Mistral or Llama 3 locally for maximum data privacy.
- **Context-Aware Insights**: The advisor uses your real transaction data and portfolio state to provide tailored advice.
- **Retrieval-Augmented Generation (RAG)**: Built-in knowledge base for financial laws, tax codes, and investment principles.

### 📊 Advanced Financial Analytics
- **Dynamic Dashboards**: High-fidelity visualizations of income, expenses, and savings trends using **Recharts**.
- **Automated Categorization**: ML-driven transaction classification with manual feedback loops for continuous improvement.
- **Real-time Monitoring**: Stay updated with live financial metrics and alerts.

### 📈 Investment Portfolio Analysis
- **CAMS/KFintech Support**: Parse and analyze your Mutual Fund and Stock statements (CAS) automatically.
- **Performance Tracking**: Visual performance metrics for your investments.

### 💑 Couple's Money Planner
- **Collaborative Planning**: Shared financial goals and budget tracking for couples.
- **Proportional Contribution Analysis**: Plan shared expenses based on individual income levels.

### ⚖️ Tax Intelligence
- **Tax Planning**: Smart suggestions for tax-saving investments.
- **Reporting**: Automated summaries for tax filing preparation.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State Management**: React Hooks & Context API
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for premium, fluid UI transitions.
- **Visuals**: [Recharts](https://recharts.org/) for interactive data visualization.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Modern, high-contrast CSS with a focus on dark-mode aesthetics.

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **OR/M**: [SQLAlchemy](https://www.sqlalchemy.org/) with [Alembic](https://alembic.sqlalchemy.org/) for migrations.
- **AI/LLM**: Support for **Ollama (Local)**, **OpenAI GPT**, and **Google Gemini**.
- **Orchestration**: [LangGraph](https://www.langchain.com/langgraph) for complex AI agent workflows.
- **Vector DB**: [FAISS](https://github.com/facebookresearch/faiss) for RAG indexing.
- **Processing**: Pandas, NumPy, Scikit-learn, Statsmodels for quantitative analysis.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (LTS recommended)
- API keys for OpenAI or Google Gemini (stored in `.env`)

### Local Setup

#### 1. Clone the repository
```bash
git clone https://github.com/sahilawatramani/FinAssist.git
cd FinAssist
```

#### 2. Backend Configuration
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env and set your LLM_PROVIDER (e.g., 'ollama', 'openai', or 'gemini')
# For Ollama, ensure it's running locally (http://localhost:11434)
```

#### 3. Frontend Configuration
```bash
cd ../frontend
npm install
cp .env.example .env
```

#### 4. Running the Application
**Fast Start (Windows Only):**
From the root directory, run:
```powershell
.\run.ps1
```

**Manual Start:**
- **Backend:** `cd backend && uvicorn app.main:app --reload` (Runs on http://localhost:8000)
- **Frontend:** `cd frontend && npm run dev` (Runs on http://localhost:5173)

---

## 📂 Project Structure

```text
FinAssist/
├── backend/            # FastAPI Project
│   ├── app/            # Main application logic
│   │   ├── agents/     # LangGraph Agent definitions
│   │   ├── routers/    # API Endpoints
│   │   ├── services/   # Business logic & AI services
│   │   └── models/     # DB Schemas (SQLAlchemy)
│   ├── alembic/        # Database migrations
│   └── tests/          # Pytest suite
├── frontend/           # Vite + React Project
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Dashboard and Feature pages
│   │   └── services/   # API communication (Axios)
│   └── public/         # Static assets
└── scripts/            # Utility scripts for data generation
```

---

## 🛡️ Security & Privacy
FinAssist is built with privacy-first principles. Local database support is the default, and AI interactions are obfuscated where possible. Security headers and CSRF protections are baked into the core FastAPI middleware.

---

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a PR for any features, bug fixes, or UI enhancements.

## 📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
