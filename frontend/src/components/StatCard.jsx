const STYLES = {
  purple: {
    icon: 'rgba(108, 99, 255, 0.12)',
    iconColor: '#6C63FF',
    hover: 'rgba(108, 99, 255, 0.3)',
    glow: 'rgba(108, 99, 255, 0.1)',
  },
  teal: {
    icon: 'rgba(0, 212, 170, 0.12)',
    iconColor: '#00D4AA',
    hover: 'rgba(0, 212, 170, 0.3)',
    glow: 'rgba(0, 212, 170, 0.1)',
  },
  red: {
    icon: 'rgba(255, 71, 87, 0.12)',
    iconColor: '#FF4757',
    hover: 'rgba(255, 71, 87, 0.3)',
    glow: 'rgba(255, 71, 87, 0.1)',
  },
  amber: {
    icon: 'rgba(255, 184, 0, 0.12)',
    iconColor: '#FFB800',
    hover: 'rgba(255, 184, 0, 0.3)',
    glow: 'rgba(255, 184, 0, 0.1)',
  },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'purple' }) {
  const s = STYLES[color] ?? STYLES.purple

  return (
    <div className="dark-card" style={{ padding: '20px' }}>
      <div className="flex items-start justify-between" style={{ marginBottom: '14px' }}>
        <span style={{ color: '#6B6B8A', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '34px',
              height: '34px',
              background: s.icon,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={15} color={s.iconColor} />
          </div>
        )}
      </div>
      <p
        style={{
          color: '#E8E8F0',
          fontSize: '22px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
      {subtitle && (
        <p style={{ color: '#3A3A5C', fontSize: '11px', marginTop: '6px', fontWeight: 500 }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
