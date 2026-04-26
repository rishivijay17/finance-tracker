import numpy as np
from collections import defaultdict


def detect_anomalies(transactions: list[dict]) -> list[dict]:
    """
    Flag expense transactions that are statistically unusual within their category.
    Uses a z-score threshold and a 3× mean heuristic.
    """
    # Build per-category expense lists
    by_category: dict[str, list[float]] = defaultdict(list)
    for t in transactions:
        if t.get("amount", 0) < 0:
            by_category[t["category"]].append(abs(t["amount"]))

    # Compute stats (only meaningful with ≥3 data points)
    stats: dict[str, dict] = {}
    for cat, amounts in by_category.items():
        if len(amounts) >= 3:
            stats[cat] = {
                "mean": float(np.mean(amounts)),
                "std": float(np.std(amounts)),
            }

    result = []
    for t in transactions:
        is_anomaly = False
        reason = None

        if t.get("amount", 0) < 0:
            amt = abs(t["amount"])
            cat = t["category"]
            s = stats.get(cat)

            if s and s["std"] > 0:
                z = (amt - s["mean"]) / s["std"]
                if z > 2.5:
                    is_anomaly = True
                    reason = (
                        f"Unusually high {cat} spend "
                        f"(${amt:.0f} vs your typical ${s['mean']:.0f})"
                    )

            # Secondary check: more than 3× the category average
            if not is_anomaly and s and amt > s["mean"] * 3 and amt > 50:
                is_anomaly = True
                reason = f"3× higher than your average {cat} transaction"

        t["is_anomaly"] = is_anomaly
        t["anomaly_reason"] = reason
        result.append(t)

    return result
