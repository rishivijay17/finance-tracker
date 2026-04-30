import { useState } from 'react'
import { AlertTriangle, Search, SlidersHorizontal } from 'lucide-react'

const CATEGORIES = [
  'All', 'Food', 'Transport', 'Shopping', 'Entertainment',
  'Bills', 'Health', 'Travel', 'Income', 'Transfer', 'Other',
]

const CAT_STYLE = {
  Food:          { bg: 'rgba(255,107,61,0.12)',  color: '#FF6B3D' },
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
