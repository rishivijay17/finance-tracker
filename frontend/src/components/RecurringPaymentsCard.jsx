import { RefreshCw, AlertTriangle } from 'lucide-react'

const FREQ_LABEL = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
}

const FREQ_COLOR = {
  weekly: '#FF6B3D',
  'bi-weekly': '#FFB800',
  monthly: '#6C63FF',
  quarterly: '#06B6D4',
  annual: '#00D4AA',
}

export default function RecurringPaymentsCard({ data, loading = false }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: '44px', background: '#1E1E2E', borderRadius: '8px', opacity: 0.5 }} />
        ))}
      </div>
    )
  }

  if (!data || !data.payments || data.payments.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          padding: '24px 0',
          color: '#3A3A5C',
          textAlign: 'center',
        }}
      >
        <RefreshCw size={28} color="#3A3A5C" />
        <p style={{ fontSize: '13px' }}>
          No recurring payments detected yet. Upload multiple months of data for better detection.
        </p>
      </div>
    )
  }

  const { payments, total_annual, income_percentage, warning, currency_symbol } = data
  const cur = currency_symbol || '₹'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Warning banner */}
      {warning && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(255,71,87,0.08)',
            border: '1px solid rgba(255,71,87,0.2)',
            borderRadius: '10px',
          }}
        >
          <AlertTriangle size={14} color="#FF4757" style={{ flexShrink: 0 }} />
          <p style={{ color: '#FF4757', fontSize: '12px', fontWeight: 500, margin: 0 }}>
            Recurring payments are {income_percentage}% of your income — exceeds the 15% recommended limit.
          </p>
        </div>
      )}

      {/* Payment list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {payments.map((p) => {
          const freqColor = FREQ_COLOR[p.frequency] || '#6B6B8A'
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: '#0E0E16',
                border: '1px solid #1E1E2E',
                borderRadius: '9px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: `${freqColor}18`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <RefreshCw size={13} color={freqColor} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  className="truncate"
                  style={{ color: '#E8E8F0', fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}
                >
                  {p.name}
                </p>
                <p style={{ color: '#6B6B8A', fontSize: '10px' }}>
                  <span
                    style={{
                      color: freqColor,
                      background: `${freqColor}15`,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      marginRight: '6px',
                    }}
                  >
                    {FREQ_LABEL[p.frequency] || p.frequency}
                  </span>
                  {cur}{p.annual_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/yr
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ color: '#FF4757', fontSize: '13px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  -{cur}{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p style={{ color: '#3A3A5C', fontSize: '10px' }}>per {p.frequency === 'bi-weekly' ? '2 weeks' : p.frequency.replace('ly', '')}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: '#0E0E16',
          borderRadius: '10px',
          border: '1px solid #1E1E2E',
          marginTop: '2px',
        }}
      >
        <span style={{ color: '#6B6B8A', fontSize: '12px', fontWeight: 500 }}>
          Total annual recurring cost
        </span>
        <span style={{ color: '#E8E8F0', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {cur}{total_annual.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  )
}
