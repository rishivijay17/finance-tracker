import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function AnomalyCard({ anomalies }) {
  if (!anomalies.length) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
        <p className="text-emerald-700 text-sm font-medium">
          No unusual spending detected — everything looks normal!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {anomalies.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
        >
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={15} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-slate-800 text-sm font-semibold truncate">{a.description}</p>
              <span className="text-red-600 text-sm font-bold shrink-0">
                −${Math.abs(a.amount).toFixed(2)}
              </span>
            </div>
            <p className="text-amber-700 text-xs mt-0.5">{a.anomaly_reason}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {a.date} · {a.category}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
