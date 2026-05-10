import os
import json
import re
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()

_MODEL = "gemini-2.5-flash"


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set. Please add it to backend/.env")
    return genai.Client(api_key=api_key)


def _gemini_call(client: genai.Client, prompt: str, max_attempts: int = 3, wait_seconds: int = 20) -> str:
    """
    Call Gemini and retry up to max_attempts times on 429 quota errors,
    waiting wait_seconds between each attempt.
    """
    last_exc: Exception | None = None

    for attempt in range(max_attempts):
        try:
            response = client.models.generate_content(
                model=_MODEL,
                contents=prompt,
            )
            return response.text
        except Exception as e:
            last_exc = e
            err = str(e).lower()
            is_quota = "429" in str(e) or any(
                kw in err for kw in ("quota", "resource_exhausted", "resource exhausted", "rate limit", "too many")
            )
            if is_quota and attempt < max_attempts - 1:
                time.sleep(wait_seconds)
                continue
            raise

    raise last_exc  # satisfies type checkers; loop always raises first


def _parse_json(text: str) -> list:
    """Strip markdown fences and parse JSON from a Gemini response."""
    text = text.strip()
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    return json.loads(text.strip())


def extract_transactions(pdf_text: str) -> list[dict]:
    client = _get_client()

    prompt = f"""You are a bank statement parser. Extract ALL transactions from the text below.

Return ONLY a valid JSON array — no extra text or markdown. Each object must have:
- "date": string in YYYY-MM-DD format (if year is missing, use the current year)
- "description": clean merchant or transaction name
- "amount": float — NEGATIVE for expenses/debits, POSITIVE for income/credits
- "category": exactly one of ["Food", "Petrol", "Groceries", "Utilities", "Miscellaneous"]
  Use these rules:
  * Food — Zomato, Swiggy (food orders), restaurants, cafes, food delivery
  * Petrol — HPCL, BPCL, Indian Oil, HP Petrol, fuel pumps, petrol stations
  * Groceries — Blinkit, Swiggy Instamart, Zepto, BigBasket, Reliance Smart, DMart, supermarkets
  * Utilities — electricity bill, BESCOM, MSEB, Jio recharge, Airtel recharge, internet bill, Netflix, Hotstar, Amazon Prime, Spotify, gas cylinder, LPG, water bill
  * Miscellaneous — everything else: salary credit, ATM withdrawals, Amazon shopping, Flipkart, transfers, EMIs, and any transaction that does not clearly match the above

Example output:
[
  {{"date": "2024-03-15", "description": "Zomato", "amount": -450.00, "category": "Food"}},
  {{"date": "2024-03-16", "description": "Monthly Salary", "amount": 65000.00, "category": "Miscellaneous"}}
]

Bank statement text:
{pdf_text[:8000]}
"""
    raw = _gemini_call(client, prompt)
    return _parse_json(raw)


def answer_question(question: str, financial_summary: str, history: list[dict]) -> str:
    client = _get_client()

    history_text = ""
    for msg in history[-6:]:  # last 3 exchanges for context
        role = "User" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['content']}\n"

    prompt = f"""You are a personal finance AI assistant. Answer the user's question using their financial data.

Financial Data:
{financial_summary}

Recent conversation:
{history_text}

User: {question}

Give a helpful, specific answer in plain English. Use actual numbers from the data. Be concise but complete.
If data is insufficient to answer, say so honestly.
"""
    return _gemini_call(client, prompt)
