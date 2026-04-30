import { TrendingUp, TrendingDown, Calendar, Zap } from 'lucide-react'

export default function ForecastCard({ forecast, currency = '$' }) {
  if (!forecast) return null

  const {
    current_month_spending,
    projected_month_spending,
    days_elapsed,
    days_remaining,
    daily_rate,
    alert,
  } = forecast

  const isWarning = projected_month_spending > current_month_spending * 1.1
  const progress = projected_month_spending > 0
    ? Math.min((current_month_spending / projected_month_spending) * 100, 100)
    : 0

  const accentColor = isWarning ? '#FF4757' : '#00D4AA'
  const accentBg = isWarning ? 'rgba(255,71,87,0.06)' : 'rgba(0,212,170,0.06)'
  const accentBorder = isWarning ? 'rgba(255,71,87,0.2)' : 'rgba(0,212,170,0.2)'

  return (
    <div
      className="rounded-xl p-5 h-full flex flex-col"
      style={{
        background: accentBg,
        border: `1px solid ${accentBorder}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div
          style={{
            width: '28px',
            height: '28px',
            background: isWarning ? 'rgba(255,71,87,0.12)' : 'rgba(0,212,170,0.12)',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Calendar size={13} color={accentColor} />
        </div>
        <h3 style={{ color: '#E8E8F0', fontSize: '13px', fontWeight: 700 }}>
          Month-End Forecast
        </h3>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p style={{ color: '#6B6B8A', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Spent so far
          </p>
          <p style={{ color: '#E8E8F0', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
            {currency}{current_month_spending.toFixed(0)}
          </p>
        </div>
        <div>
          <p style={{ color: '#6B6B8A', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Projected total
          </p>
          <p style={{ color: accentColor, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
            {currency}{projected_month_spending.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1.5">
          <span style={{ color: '#6B6B8A', fontSize: '10px' }}>Progress this month</span>
          <span style={{ color: accentColor, fontSize: '10px', fontWeight: 600 }}>{progress.toFixed(0)}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: isWarning
                ? 'linear-gradient(90deg, #FF4757, #FF8C00)'
                : 'linear-gradient(90deg, #6C63FF, #00D4AA)',
            }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-1.5 mb-4" style={{ color: '#6B6B8A', fontSize: '11px' }}>
        {isWarning
          ? <TrendingUp size={11} color="#FF4757" />
          : <TrendingDown size={11} color="#00D4AA" />
        }
        <span>
          {currency}{daily_rate.toFixed(0)}/day · {days_elapsed}d elapsed · {days_remaining}d left
        </span>
      </div>

      {/* Alert */}
      {alert && (
        <div
          className="mt-auto pt-3 rounded-lg px-3 py-2.5"
          style={{
            background: isWarning ? 'rgba(255,71,87,0.08)' : 'rgba(0,212,170,0.08)',
            border: `1px solid ${accentBorder}`,
          }}
        >
          <div className="flex items-start gap-2">
            <Zap size={11} color={accentColor} style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ color: accentColor, fontSize: '11px', fontWeight: 500, lineHeight: 1.5 }}>
              {alert}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
