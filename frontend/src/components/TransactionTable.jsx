import { useState, useRef } from 'react'
import { AlertTriangle, Search, SlidersHorizontal, HelpCircle } from 'lucide-react'

const CATEGORIES = [
  'All', 'Food', 'Petrol', 'Groceries', 'Utilities', 'Miscellaneous',
  'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Travel', 'Income', 'Transfer', 'Other',
]

const CAT_STYLE = {
  Food:          { bg: 'rgba(255,107,61,0.12)',  color: '#FF6B3D' },
  Petrol:        { bg: 'rgba(255,184,0,0.12)',   color: '#FFB800' },
  Groceries:     { bg: 'rgba(0,212,170,0.12)',   color: '#00D4AA' },
  Utilities:     { bg: 'rgba(6,182,212,0.12)',   color: '#06B6D4' },
  Miscellaneous: { bg: 'rgba(107,107,138,0.12)', color: '#8B8BAA' },
  Transport:     { bg: 'rgba(74,143,255,0.12)',   color: '#4A8FFF' },
  Shopping:      { bg: 'rgba(167,139,250,0.12)',  color: '#A78BFA' },
  Entertainment: { bg: 'rgba(236,72,153,0.12)',   color: '#EC4899' },
  Bills:         { bg: 'rgba(255,71,87,0.12)',    color: '#FF4757' },
  Health:        { bg: 'rgba(0,212,170,0.12)',    color: '#00D4AA' },
  Travel:        { bg: 'rgba(6,182,212,0.12)',    color: '#06B6D4' },
  Income:        { bg: 'rgba(0,212,170,0.12)',    color: '#00D4AA' },
  Transfer:      { bg: 'rgba(107,107,138,0.12)', color: '#6B6B8A' },
  Other:         { bg: 'rgba(58,58,92,0.3)',      color: '#6B6B8A' },
}

function CategorizationTooltip({ reason }) {
  const [visible, setVisible] = useState(false)
  const btnRef = useRef(null)

  if (!reason) return null

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        ref={btnRef}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'help',
          padding: '0 0 0 4px',
          display: 'inline-flex',
          alignItems: 'center',
          color: '#3A3A5C',
          lineHeight: 0,
        }}
        title={reason}
        aria-label={`Categorized because: ${reason}`}
      >
        <HelpCircle size={11} />
      </button>
      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1E1E2E',
            border: '1px solid #2E2E40',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '11px',
            color: '#C8C8E0',
            whiteSpace: 'normal',
            maxWidth: '260px',
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            lineHeight: 1.5,
            pointerEvents: 'none',
          }}
        >
          <span style={{ color: '#6B6B8A', fontWeight: 600, display: 'block', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Why this category?
          </span>
          {reason}
          {/* Tooltip arrow */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #2E2E40',
          }} />
        </div>
      )}
    </div>
  )
}

export default function TransactionTable({ transactions, currency = '$' }) {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = transactions.filter((t) => {
    const matchCat = category === 'All' || t.category === category
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-52">
          <Search
            size={13}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3A3A5C' }}
          />
          <input
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark"
            style={{ paddingLeft: '34px' }}
          />
        </div>
        <div className="relative">
          <SlidersHorizontal
            size={13}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3A3A5C', pointerEvents: 'none' }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              background: '#16161F',
              border: '1px solid #1E1E2E',
              color: '#E8E8F0',
              borderRadius: '10px',
              padding: '10px 14px 10px 32px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} style={{ background: '#16161F' }}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
              {['Date', 'Description', 'Category', 'Amount'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '0 12px 12px',
                    textAlign: i === 3 ? 'right' : 'left',
                    color: '#3A3A5C',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{ padding: '48px 12px', textAlign: 'center', color: '#3A3A5C', fontSize: '13px' }}
                >
                  {transactions.length === 0
                    ? 'No transactions yet. Upload a bank statement to get started.'
                    : 'No transactions match your filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((t, idx) => {
                const catStyle = CAT_STYLE[t.category] ?? CAT_STYLE.Other
                const isEven = idx % 2 === 0
                return (
                  <tr
                    key={t.id}
                    style={{
                      background: t.is_anomaly
                        ? 'rgba(255,184,0,0.04)'
                        : isEven
                        ? 'transparent'
                        : 'rgba(255,255,255,0.018)',
                      borderBottom: '1px solid rgba(30,30,46,0.5)',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!t.is_anomaly) e.currentTarget.style.background = 'rgba(108,99,255,0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = t.is_anomaly
                        ? 'rgba(255,184,0,0.04)'
                        : isEven ? 'transparent' : 'rgba(255,255,255,0.018)'
                    }}
                  >
                    <td style={{ padding: '11px 12px', color: '#6B6B8A', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {t.date}
                    </td>
                    <td style={{ padding: '11px 12px', maxWidth: '280px' }}>
                      <div className="flex items-center gap-2">
                        {t.is_anomaly && (
                          <AlertTriangle size={11} color="#FFB800" style={{ flexShrink: 0 }} title={t.anomaly_reason} />
                        )}
                        <span
                          className="truncate"
                          style={{ color: '#E8E8F0', fontWeight: 500 }}
                        >
                          {t.description}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 12px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <span
                          style={{
                            background: catStyle.bg,
                            color: catStyle.color,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '10px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t.category}
                        </span>
                        <CategorizationTooltip reason={t.categorization_reason} />
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '11px 12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: '13px',
                        fontVariantNumeric: 'tabular-nums',
                        color: t.amount >= 0 ? '#00D4AA' : '#FF4757',
                      }}
                    >
                      {t.amount >= 0 ? '+' : ''}{currency}{Math.abs(t.amount).toFixed(2)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p style={{ color: '#3A3A5C', fontSize: '11px', marginTop: '16px' }}>
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          {category !== 'All' || search ? ` (filtered from ${transactions.length})` : ''}
        </p>
      )}
    </div>
  )
}
