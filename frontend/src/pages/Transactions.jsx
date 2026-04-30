import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Trash2, Receipt, ChevronDown, Calendar } from 'lucide-react'
import TransactionTable from '../components/TransactionTable'
import { getTransactions, clearTransactions, getCurrency, getSessions } from '../api/client'
import toast from 'react-hot-toast'

function SessionDropdown({ sessions, selectedId, onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = sessions.find((s) => s.id === selectedId) ?? sessions[0]

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!sessions.length) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2"
        style={{
          padding: '8px 12px',
          background: '#111118',
          border: '1px solid #1E1E2E',
          borderRadius: '8px',
          color: '#E8E8F0',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif',
          minWidth: '170px',
          justifyContent: 'space-between',
        }}
      >
        <span className="flex items-center gap-2">
          <Calendar size={13} color="#6C63FF" />
          {current?.statement_period ?? 'Select statement'}
        </span>
        <ChevronDown
          size={13}
          color="#6B6B8A"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: '220px',
            background: '#111118',
            border: '1px solid #1E1E2E',
            borderRadius: '12px',
            padding: '6px',
            zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {sessions.map((s, i) => {
            const isSelected = s.id === selectedId
            const isLatest = i === 0
            return (
              <button
                key={s.id}
                onClick={() => { onSelect(s.id); setOpen(false) }}
                className="flex items-center gap-2 w-full"
                style={{
                  padding: '8px 10px',
                  background: isSelected ? 'rgba(108,99,255,0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  marginBottom: '2px',
                }}
              >
                <span style={{ color: isSelected ? '#6C63FF' : '#E8E8F0', fontSize: '13px', fontWeight: 600, flex: 1 }}>
                  {s.statement_period ?? `Session ${s.id}`}
                </span>
                {isLatest && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      background: 'rgba(0,212,170,0.12)',
                      color: '#00D4AA',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Latest
                  </span>
                )}
                <span style={{ color: '#3A3A5C', fontSize: '11px' }}>{s.transaction_count}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Transactions() {
  const [sessions, setSessions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [currency, setCurrency] = useState('$')
  const [loading, setLoading] = useState(true)

  const fetchData = async (sid) => {
    setLoading(true)
    try {
      const params = sid != null ? { session_id: sid } : {}
      const [res, cur] = await Promise.all([getTransactions(params), getCurrency()])
      setTransactions(res.data)
      setCurrency(cur.data.currency_symbol ?? '$')
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const sessRes = await getSessions()
        const list = sessRes.data
        setSessions(list)
        const latestId = list[0]?.id ?? null
        setSelectedId(latestId)
        await fetchData(latestId)
      } catch {
        toast.error('Failed to load sessions')
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleSessionChange = async (newId) => {
    setSelectedId(newId)
    await fetchData(newId)
  }

  const handleClear = async () => {
    if (!confirm('Delete ALL transactions and sessions? This cannot be undone.')) return
    try {
      await clearTransactions()
      setTransactions([])
      setSessions([])
      setSelectedId(null)
      toast.success('All transactions cleared')
    } catch {
      toast.error('Failed to clear transactions')
    }
  }

  return (
    <div className="page-enter" style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '28px' }}>
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'rgba(108,99,255,0.1)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Receipt size={16} color="#6C63FF" />
          </div>
          <div>
            <h1 style={{ color: '#E8E8F0', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.4px' }}>
              Transactions
            </h1>
            <p style={{ color: '#3A3A5C', fontSize: '12px', marginTop: '2px', fontWeight: 500 }}>
              {loading ? 'Loading…' : `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} in this statement`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <SessionDropdown
              sessions={sessions}
              selectedId={selectedId}
              onSelect={handleSessionChange}
            />
          )}
          <button
            onClick={() => fetchData(selectedId)}
            className="flex items-center gap-1.5"
            style={{
              padding: '8px 14px',
              background: '#111118',
              border: '1px solid #1E1E2E',
              borderRadius: '8px',
              color: '#6B6B8A',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#E8E8F0'; e.currentTarget.style.borderColor = '#3A3A5C' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6B8A'; e.currentTarget.style.borderColor = '#1E1E2E' }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          {transactions.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5"
              style={{
                padding: '8px 14px',
                background: 'rgba(255,71,87,0.06)',
                border: '1px solid rgba(255,71,87,0.2)',
                borderRadius: '8px',
                color: '#FF4757',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,71,87,0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,71,87,0.06)' }}
            >
              <Trash2 size={13} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="dark-card-static" style={{ padding: '24px' }}>
        {loading ? (
          <div className="flex justify-center" style={{ padding: '64px 0' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                border: '3px solid #1E1E2E',
                borderTopColor: '#6C63FF',
                borderRadius: '50%',
              }}
              className="animate-spin"
            />
          </div>
        ) : (
          <TransactionTable transactions={transactions} currency={currency} />
        )}
      </div>
    </div>
  )
}
