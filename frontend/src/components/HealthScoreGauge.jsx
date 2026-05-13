export default function HealthScoreGauge({ score = 0, grade = 'No Data', color = '#6B6B8A', breakdown = {} }) {
  const r = 52
  const circumference = 2 * Math.PI * r
  const arcLength = circumference * 0.75   // 270° sweep
  const gapLength = circumference * 0.25
  const progress = (Math.min(100, Math.max(0, score)) / 100) * arcLength

  const breakdownItems = [
    { label: 'Savings Rate', key: 'savings_rate', max: 40 },
    { label: 'Consistency', key: 'consistency', max: 20 },
    { label: 'Category Balance', key: 'category_balance', max: 20 },
    { label: 'Anomaly Control', key: 'anomaly_control', max: 20 },
  ]

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Circular gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <svg viewBox="0 0 120 120" width="130" height="130">
          {/* Background track */}
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke="#1E1E2E"
            strokeWidth="10"
            strokeDasharray={`${arcLength} ${gapLength}`}
            strokeLinecap="round"
            transform="rotate(135 60 60)"
          />
          {/* Progress arc */}
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(135 60 60)"
            style={{ filter: `drop-shadow(0 0 6px ${color}60)`, transition: 'stroke-dasharray 1s ease' }}
          />
          {/* Score number */}
          <text
            x="60" y="55"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#E8E8F0"
            fontSize="26"
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {score}
          </text>
          <text
            x="60" y="72"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6B6B8A"
            fontSize="10"
            fontFamily="Inter, system-ui, sans-serif"
          >
            / 100
          </text>
        </svg>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color,
            background: `${color}18`,
            padding: '3px 10px',
            borderRadius: '999px',
            border: `1px solid ${color}30`,
          }}
        >
          {grade}
        </span>
      </div>

      {/* Breakdown bars */}
      <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {breakdownItems.map(({ label, key, max }) => {
          const val = breakdown[key] ?? 0
          const pct = (val / max) * 100
          return (
            <div key={key}>
              <div className="flex justify-between" style={{ marginBottom: '4px' }}>
                <span style={{ color: '#6B6B8A', fontSize: '11px', fontWeight: 500 }}>{label}</span>
                <span style={{ color: '#E8E8F0', fontSize: '11px', fontWeight: 700 }}>
                  {Math.round(val)}<span style={{ color: '#3A3A5C' }}>/{max}</span>
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 70 ? '#00D4AA' : pct >= 40 ? '#FFB800' : '#FF4757',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
