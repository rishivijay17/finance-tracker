import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Receipt, Zap } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
]

export default function Sidebar() {
  return (
    <aside
      className="flex flex-col shrink-0 h-full"
      style={{
        width: '232px',
        background: 'linear-gradient(180deg, #0D0D18 0%, #0A0A0F 100%)',
        borderRight: '1px solid #1E1E2E',
      }}
    >
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: '1px solid #1E1E2E' }}>
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #6C63FF 0%, #4A44B3 100%)',
              borderRadius: '10px',
              boxShadow: '0 0 20px rgba(108, 99, 255, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={17} color="white" fill="white" />
          </div>
          <div>
            <h1 style={{ color: '#E8E8F0', fontWeight: 700, fontSize: '13px', lineHeight: '1.3', letterSpacing: '-0.2px' }}>
              Rishi's Finance Tracker
            </h1>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3" style={{ paddingTop: '20px' }}>
        <p
          style={{
            color: '#3A3A5C',
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '0 14px 10px',
          }}
        >
          Navigation
        </p>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={15}
                  style={{ color: isActive ? '#6C63FF' : '#6B6B8A', flexShrink: 0 }}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: '1px solid #1E1E2E' }}>
        <div className="flex items-center gap-2.5 px-2">
          <div
            className="glow-dot"
            style={{
              width: '7px',
              height: '7px',
              background: '#00D4AA',
              borderRadius: '50%',
              flexShrink: 0,
            }}
          />
          <span style={{ color: '#6B6B8A', fontSize: '11px', fontWeight: 500 }}>
            Powered by Gemini AI
          </span>
        </div>
      </div>
    </aside>
  )
}
