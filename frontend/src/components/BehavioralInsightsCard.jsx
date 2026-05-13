import { Brain, Lightbulb } from 'lucide-react'

export default function BehavioralInsightsCard({ insights = [], loading = false }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '40px',
              background: '#1E1E2E',
              borderRadius: '8px',
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    )
  }

  if (!insights || insights.length === 0) {
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
        <Brain size={28} color="#3A3A5C" />
        <p style={{ fontSize: '13px' }}>
          Upload a bank statement to generate AI spending insights.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {insights.map((insight, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '11px 13px',
            background: 'rgba(108,99,255,0.06)',
            border: '1px solid rgba(108,99,255,0.15)',
            borderRadius: '10px',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              background: 'rgba(108,99,255,0.15)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px',
            }}
          >
            <Lightbulb size={12} color="#6C63FF" />
          </div>
          <p style={{ color: '#C8C8E0', fontSize: '13px', lineHeight: 1.55, margin: 0 }}>
            {insight}
          </p>
        </div>
      ))}
    </div>
  )
}
