import re
from collections import defaultdict
from datetime import datetime


def _normalize(name: str) -> str:
    n = name.lower().strip()
    n = re.sub(r"\b(ltd|pvt|inc|llc|co|corp|limited|private|public)\b\.?", "", n)
    n = re.sub(r"[^a-z\s]", "", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n[:25]


def detect_recurring(transactions: list) -> list[dict]:
    """
    Detect recurring payments from a list of transaction dicts.
    Requires at least 2 occurrences of similar amount at regular intervals.
    """
    def _get(t, field):
        if hasattr(t, field):
            return getattr(t, field)
        return t.get(field) if isinstance(t, dict) else None

    expenses = [t for t in transactions if float(_get(t, "amount") or 0) < 0]

    groups: dict[str, list] = defaultdict(list)
    for t in expenses:
        key = _normalize(_get(t, "description") or "")
        if key:
            groups[key].append(t)

    recurring = []
    for key, txns in groups.items():
        if len(txns) < 2:
            continue

        sorted_txns = sorted(txns, key=lambda t: _get(t, "date") or "")
        amounts = [abs(float(_get(t, "amount") or 0)) for t in sorted_txns]
        avg_amount = sum(amounts) / len(amounts)

        if avg_amount < 1:
            continue

        # Amount consistency: all within 25% of mean
        if not all(abs(a - avg_amount) / avg_amount < 0.25 for a in amounts):
            continue

        dates = [(_get(t, "date") or "")[:10] for t in sorted_txns]
        intervals = []
        for i in range(1, len(dates)):
            try:
                d1 = datetime.strptime(dates[i - 1], "%Y-%m-%d")
                d2 = datetime.strptime(dates[i], "%Y-%m-%d")
                diff = (d2 - d1).days
                if diff > 0:
                    intervals.append(diff)
            except Exception:
                pass

        if not intervals:
            continue

        avg_interval = sum(intervals) / len(intervals)

        if 25 <= avg_interval <= 35:
            freq, annual = "monthly", avg_amount * 12
        elif 6 <= avg_interval <= 8:
            freq, annual = "weekly", avg_amount * 52
        elif 13 <= avg_interval <= 16:
            freq, annual = "bi-weekly", avg_amount * 26
        elif 85 <= avg_interval <= 100:
            freq, annual = "quarterly", avg_amount * 4
        elif 350 <= avg_interval <= 380:
            freq, annual = "annual", avg_amount
        else:
            continue

        recurring.append({
            "name": _get(sorted_txns[-1], "description") or key.title(),
            "amount": round(avg_amount, 2),
            "frequency": freq,
            "annual_cost": round(annual, 2),
            "category": _get(sorted_txns[0], "category") or "Utilities",
            "last_date": dates[-1] if dates else "",
        })

    return sorted(recurring, key=lambda x: x["annual_cost"], reverse=True)
