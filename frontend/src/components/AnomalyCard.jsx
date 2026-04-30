import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function AnomalyCard({ anomalies, currency = '$' }) {
  if (!anomalies.length) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl p-4"
        style={{
          background: 'rgba(0, 212, 170, 0.06)',
          border: '1px solid rgba(0, 212, 170, 0.2)',
        }}
      >
        <CheckCircle2 size={18} color="#00D4AA" style={{ flexShrink: 0 }} />
        <p style={{ color: '#00D4AA', fontSize: '13px', fontWeight: 500 }}>
          No unusual spending detected — everything looks normal!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {anomalies.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 rounded-xl p-4"
          style={{
            background: 'rgba(255, 184, 0, 0.05)',
            border: '1px solid rgba(255, 184, 0, 0.15)',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              background: 'rgba(255, 184, 0, 0.12)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px',
            }}
          >
            <AlertTriangle size={13} color="#FFB800" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p
                className="truncate"
                style={{ color: '#E8E8F0', fontSize: '13px', fontWeight: 600 }}
              >
                {a.description}
              </p>
              <span
                style={{
                  color: '#FF4757',
                  fontSize: '13px',
                  fontWeight: 700,
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                −{currency}{Math.abs(a.amount).toFixed(2)}
              </span>
            </div>
            <p style={{ color: '#FFB800', fontSize: '11px', marginTop: '3px' }}>
              {a.anomaly_reason}
            </p>
            <p style={{ color: '#3A3A5C', fontSize: '11px', marginTop: '2px' }}>
              {a.date} · {a.category}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
