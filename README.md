# AI Finance Tracker

A web app that parses your bank statement PDFs, categorizes transactions automatically, and lets you ask questions about your spending in plain English.

Built this for myself — I'm a final year student living alone and wanted a proper way to track my expenses without doing it manually.

![Dashboard](screenshots/dashboard.png)

---

## What It Does

- **PDF Upload** — drop in your bank statement, Gemini reads it and extracts every transaction with a category
- **Dashboard** — spending breakdown by category, monthly income vs expenses, running balance
- **AI Chat** — ask things like "how much did I spend on food?" or "am I on track this month?" and get answers based on your actual data
- **Anomaly Detection** — flags transactions that look unusually large compared to your normal spending in that category
- **Month-end Forecast** — estimates where your balance will land by end of month based on your current spending pace

---

## Tech Stack

| Part | What I used | Why |
|------|-------------|-----|
| Frontend | React + Tailwind + Vite | Just what I know |
| Backend | FastAPI (Python) | Fast to build, automatic docs |
| Database | SQLite | No setup, runs locally, good enough |
| AI | Google Gemini 2.0 Flash | Free tier, good at parsing messy PDFs |
| PDF parsing | pdfplumber | Extracts tables from PDFs reliably |
| Charts | Recharts | Easy to use with React |

Everything runs locally. No cloud hosting needed.

---

## Setup

You'll need Python 3.10+ and Node 18+.

### 1. Get a free Gemini API key

Go to [aistudio.google.com](https://aistudio.google.com), sign in with Google, and create an API key.

### 2. Backend

```bash
cd backend

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

copy .env.example .env
# Open .env and add your Gemini API key
```

### 3. Start the backend

```bash
uvicorn main:app --reload
```

Leave this terminal open. Backend runs on `http://localhost:8000`.

### 4. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

### 5. Open the app

Go to `http://localhost:5173` in your browser.

---

## How to Use

**Uploading:** Drag and drop your bank statement PDF on the dashboard. Takes 15–30 seconds to process. Needs to be a digital PDF (downloaded from your bank's website), not a scanned image.

**Chat:** Ask questions in plain English — it has your full transaction history as context.

**Anomalies:** Transactions flagged with ⚠️ are ones that are unusually large for that spending category.

**Forecast:** Shows projected month-end balance based on your daily spending rate so far this month.

---

## Troubleshooting

**"GEMINI_API_KEY is not set"** — Create `backend/.env` and add `GEMINI_API_KEY=your_key_here`. See `.env.example` for the format.

**Upload fails with "Could not extract text"** — Your PDF is likely a scanned image. Download a fresh copy from your bank's internet banking portal.

**Frontend can't connect to backend** — Make sure uvicorn is still running on port 8000.

**Gemini quota errors (429)** — The app retries automatically 3 times with a 20 second wait. If it still fails, wait a minute and try again.
