import pdfplumber
import io
import re
from datetime import datetime
from typing import Optional

# ── Keyword maps used by the fallback categoriser ─────────────────────────────

INCOME_KEYWORDS = {
    "salary", "credit", "interest", "refund", "cashback",
    "reward", "reversal", "dividend", "bonus",
}

_CATEGORY_MAP: dict[str, list[str]] = {
    "Food":          ["zomato", "swiggy food", "swiggyit", "restaurant", "cafe", "food court",
                      "pizza", "dominos", "mcdonald", "kfc", "burger king", "subway"],
    "Petrol":        ["hpcl", "bpcl", "iocl", "indian oil", "hp petrol", "essar petrol",
                      "petrol", "fuel", "filling station", "fuel pump"],
    "Groceries":     ["blinkit", "instamart", "zepto", "bigbasket", "big basket",
                      "reliance smart", "dmart", "d-mart", "supermarket", "grocer"],
    "Utilities":     ["electricity", "bescom", "mseb", "msedcl", "jio", "airtel", "vodafone",
                      "bsnl", "broadband", "recharge", "netflix", "hotstar", "disney",
                      "amazon prime", "spotify", "gas cylinder", "lpg", "water bill",
                      "internet bill", "electric bill"],
}


def _categorize(description: str) -> str:
    d = description.lower()
    # Check specific categories first (order matters)
    for category, keywords in _CATEGORY_MAP.items():
        if any(kw in d for kw in keywords):
            return category
    return "Miscellaneous"


def _try_parse_date(s: str) -> Optional[str]:
    """Return YYYY-MM-DD or None."""
    s = s.strip()
    for fmt in ("%d %b %Y", "%d/%m/%Y", "%d-%m-%Y", "%d %B %Y",
                "%d %b %y", "%Y-%m-%d", "%d-%b-%Y", "%d-%b-%y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None


def _parse_amount(s: str) -> Optional[float]:
    """Parse '1,23,456.78' → 123456.78, return None if unparseable."""
    if not s or not s.strip():
        return None
    cleaned = re.sub(r"[^\d.]", "", s.strip())
    try:
        v = float(cleaned)
        return v if v > 0 else None
    except ValueError:
        return None


# ── Public API ─────────────────────────────────────────────────────────────────

_INDIAN_BANKS = re.compile(
    r'\b(HDFC|SBI|ICICI|Axis|Kotak|PNB|Bank of Baroda|Canara|Union Bank|'
    r'IndusInd|Yes Bank|IDBI|Federal Bank|RBL|South Indian Bank|'
    r'Karnataka Bank|Punjab National|Central Bank)\b',
    re.IGNORECASE,
)

def detect_currency(text: str) -> str:
    """Return '₹' for Indian bank statements, '$' otherwise.

    Triggers on: ₹ symbol, Rs. prefix, INR anywhere, or the name of a
    well-known Indian bank appearing in the document.
    """
    if re.search(r'₹|Rs\.|INR\b', text):
        return '₹'
    if _INDIAN_BANKS.search(text):
        return '₹'
    return '$'


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract statement text from a PDF.

    Uses tables when present (avoids sending duplicate data to Gemini —
    pdfplumber's plain-text output and table output often overlap, which
    doubles token usage). Falls back to plain text on pages without tables.
    """
    parts: list[str] = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            has_tables = any(t for t in tables if t)

            if has_tables:
                for table in tables:
                    for row in table:
                        if not row:
                            continue
                        cells = [str(c).strip() if c else "" for c in row]
                        row_str = " | ".join(c for c in cells if c)
                        if row_str.strip():
                            parts.append(row_str)
            else:
                text = page.extract_text()
                if text:
                    parts.append(text)

    return "\n".join(parts)


def parse_transactions_fallback(file_bytes: bytes) -> list[dict]:
    """
    Rule-based fallback parser used when Gemini is unavailable (quota exceeded,
    network error, etc.).

    Reads tables directly from pdfplumber so it can reliably distinguish
    Debit vs Credit columns, which are separate columns in most bank PDFs.
    Returns the same dict shape as the AI parser so the upload router needs
    no special-casing.
    """
    transactions: list[dict] = []
    seen: set[tuple] = set()

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                if not table:
                    continue

                # ── Detect column roles from header row ────────────────────
                date_col = desc_col = debit_col = credit_col = None

                for row in table:
                    if not row:
                        continue
                    row_lower = [str(c).lower() if c else "" for c in row]
                    if not any(w in " ".join(row_lower) for w in ("date", "narration", "description", "particulars")):
                        continue
                    # Found the header row — map columns
                    for i, cell in enumerate(row_lower):
                        if "date" in cell and date_col is None:
                            date_col = i
                        elif any(w in cell for w in ("narration", "description", "particulars", "details", "transaction")) and desc_col is None:
                            desc_col = i
                        elif any(w in cell for w in ("debit", "dr.", "dr ", "withdrawal")) and debit_col is None:
                            debit_col = i
                        elif any(w in cell for w in ("credit", "cr.", "cr ", "deposit")) and credit_col is None:
                            credit_col = i
                    break

                # Positional defaults for common bank statement layouts
                if date_col is None:
                    date_col = 0
                if desc_col is None:
                    desc_col = 1

                # ── Walk data rows ─────────────────────────────────────────
                for row in table:
                    if not row or not row[date_col]:
                        continue

                    parsed_date = _try_parse_date(str(row[date_col]))
                    if not parsed_date:
                        continue

                    desc = str(row[desc_col]).strip() if row[desc_col] else ""
                    desc = re.sub(r"\s+", " ", desc).strip()
                    # Skip header/summary rows
                    if not desc or desc.lower() in (
                        "description", "particulars", "narration",
                        "details", "transaction details",
                    ):
                        continue

                    # ── Determine amount and sign ──────────────────────────
                    amount: Optional[float] = None

                    if debit_col is not None and debit_col < len(row) and row[debit_col]:
                        amt = _parse_amount(str(row[debit_col]))
                        if amt:
                            amount = -amt  # debit → negative

                    if credit_col is not None and credit_col < len(row) and row[credit_col]:
                        amt = _parse_amount(str(row[credit_col]))
                        if amt:
                            amount = abs(amt)  # credit → positive

                    # Last resort: pick first parseable non-balance cell and
                    # use description keywords to decide sign
                    if amount is None:
                        candidates = [
                            _parse_amount(str(c))
                            for c in row[2:-1]   # skip date, desc, and trailing balance
                            if c
                        ]
                        candidates = [a for a in candidates if a]
                        if candidates:
                            is_income = any(kw in desc.lower() for kw in INCOME_KEYWORDS)
                            amount = candidates[0] if is_income else -candidates[0]

                    if amount is None:
                        continue

                    key = (parsed_date, desc[:40], round(amount, 2))
                    if key in seen:
                        continue
                    seen.add(key)

                    transactions.append({
                        "date": parsed_date,
                        "description": desc,
                        "amount": amount,
                        "category": _categorize(desc),
                    })

    return transactions
