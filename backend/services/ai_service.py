import os
import json
import re
import time
from collections import defaultdict
from datetime import datetime
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

    raise last_exc


def _parse_json(text: str) -> list:
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
- "categorization_reason": brief explanation (max 12 words) of why this category was chosen
  Examples: "merchant name contains Zomato, matches food delivery pattern"
            "BESCOM electricity payment matches utility billing"
            "salary credit, positive amount, income transaction"

Example output:
[
  {{"date": "2024-03-15", "description": "Zomato", "amount": -450.00, "category": "Food", "categorization_reason": "Zomato is a food delivery platform"}},
  {{"date": "2024-03-16", "description": "Monthly Salary", "amount": 65000.00, "category": "Miscellaneous", "categorization_reason": "salary credit, positive income transaction"}}
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


def _is_weekend(date_str: str) -> bool:
    try:
        d = datetime.strptime(date_str[:10], "%Y-%m-%d")
        return d.weekday() >= 5
    except Exception:
        return False


def _is_first_week(date_str: str) -> bool:
    try:
        return int(date_str[8:10]) <= 7
    except Exception:
        return False


def generate_behavioral_insights(transactions: list[dict], currency_symbol: str = "₹") -> list[str]:
    """Generate AI-powered behavioral spending insights from transaction data."""
    if not transactions:
        return []

    expenses = [t for t in transactions if float(t.get("amount", 0)) < 0]
    income_txns = [t for t in transactions if float(t.get("amount", 0)) > 0]

    if not expenses:
        return []

    total_expenses = sum(abs(float(t.get("amount", 0))) for t in expenses)
    total_income = sum(float(t.get("amount", 0)) for t in income_txns)

    cat_totals: dict[str, float] = defaultdict(float)
    for t in expenses:
        cat_totals[t.get("category", "Other")] += abs(float(t.get("amount", 0)))

    weekend_spend = sum(abs(float(t.get("amount", 0))) for t in expenses if _is_weekend(t.get("date", "")))
    weekday_spend = total_expenses - weekend_spend
    weekend_count = sum(1 for t in expenses if _is_weekend(t.get("date", "")))
    weekday_count = len(expenses) - weekend_count

    first_week_spend = sum(abs(float(t.get("amount", 0))) for t in expenses if _is_first_week(t.get("date", "")))
    first_week_count = sum(1 for t in expenses if _is_first_week(t.get("date", "")))
    rest_count = len(expenses) - first_week_count
    rest_spend = total_expenses - first_week_spend

    months = set(t.get("date", "")[:7] for t in transactions if t.get("date", ""))
    num_months = max(len(months), 1)

    summary = f"""Financial Data Summary:
- Currency: {currency_symbol}
- Total Income: {currency_symbol}{total_income:,.0f}
- Total Expenses: {currency_symbol}{total_expenses:,.0f}
- Net Savings: {currency_symbol}{total_income - total_expenses:,.0f}
- Months of data: {num_months}
- Category breakdown: {dict(cat_totals)}
- Weekend transactions: {weekend_count} totaling {currency_symbol}{weekend_spend:,.0f}
- Weekday transactions: {weekday_count} totaling {currency_symbol}{weekday_spend:,.0f}
- First-week-of-month spend: {currency_symbol}{first_week_spend:,.0f} ({first_week_count} txns)
- Rest-of-month spend: {currency_symbol}{rest_spend:,.0f} ({rest_count} txns)
- Total expense transactions: {len(expenses)}"""

    prompt = f"""Analyze this personal finance data and generate exactly 4 behavioral spending insights.

{summary}

Rules:
- Each insight must be 1 sentence, specific to the actual numbers
- Identify real behavioral patterns (weekend splurges, first-week overspending, subscription burden, food habits, savings trajectory)
- Be direct and personal, like a financial advisor talking to the user
- Use the currency symbol {currency_symbol} when referencing amounts
- If weekend spend per transaction > weekday, mention that. If first-week daily rate > rest-of-month, mention that.
- Include at least one savings/projection insight

Return ONLY a valid JSON array of 4 strings, no markdown, no extra text.
Example: ["Your food spending peaks on weekends.", "Subscriptions consume 18% of income.", "You save 22% of income each month.", "First-week spending is 40% higher than the rest of the month."]
"""

    try:
        client = _get_client()
        raw = _gemini_call(client, prompt, max_attempts=2, wait_seconds=5)
        insights = _parse_json(raw)
        if isinstance(insights, list):
            return [str(i) for i in insights[:5]]
    except Exception:
        pass

    # Algorithmic fallback if Gemini fails
    return _algorithmic_insights(expenses, income_txns, cat_totals, currency_symbol, num_months,
                                  weekend_spend, weekend_count, weekday_spend, weekday_count,
                                  first_week_spend, first_week_count, rest_spend, rest_count)


def _algorithmic_insights(expenses, income_txns, cat_totals, currency_symbol, num_months,
                           weekend_spend, weekend_count, weekday_spend, weekday_count,
                           first_week_spend, first_week_count, rest_spend, rest_count) -> list[str]:
    insights = []
    total_expenses = sum(abs(float(t.get("amount", 0))) for t in expenses)
    total_income = sum(float(t.get("amount", 0)) for t in income_txns)

    if weekend_count > 0 and weekday_count > 0:
        weekend_daily = weekend_spend / weekend_count
        weekday_daily = weekday_spend / weekday_count
        if weekend_daily > weekday_daily * 1.25:
            pct = round((weekend_daily / weekday_daily - 1) * 100)
            insights.append(f"Your spending is {pct}% higher on weekends than weekdays.")

    if first_week_count > 0 and rest_count > 0:
        fw_daily = first_week_spend / first_week_count
        rest_daily = rest_spend / rest_count
        if fw_daily > rest_daily * 1.35:
            pct = round((fw_daily / rest_daily - 1) * 100)
            insights.append(f"You spend {pct}% more in the first week of the month.")

    if cat_totals:
        top_cat, top_val = max(cat_totals.items(), key=lambda x: x[1])
        top_pct = round(top_val / total_expenses * 100) if total_expenses > 0 else 0
        if top_pct >= 30:
            insights.append(f"{top_cat} is your biggest expense at {top_pct}% of total spending ({currency_symbol}{top_val:,.0f}).")

    if total_income > 0:
        net = total_income - total_expenses
        monthly_savings = net / num_months
        savings_pct = round(net / total_income * 100)
        if monthly_savings > 0:
            months_to_target = round(100000 / monthly_savings)
            if months_to_target < 120:
                insights.append(f"At your current savings rate ({savings_pct}%), you could reach {currency_symbol}1,00,000 in {months_to_target} months.")
        else:
            insights.append(f"You're running a monthly deficit of {currency_symbol}{abs(monthly_savings):,.0f} — expenses exceed income.")

    utilities = cat_totals.get("Utilities", 0)
    if utilities > 0 and total_income > 0:
        sub_pct = round(utilities / total_income * 100)
        insights.append(f"Subscriptions & utilities consume {sub_pct}% of your income ({currency_symbol}{utilities:,.0f}).")

    return insights[:4]
