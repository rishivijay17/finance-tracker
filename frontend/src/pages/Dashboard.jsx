import { useState, useEffect, useRef } from 'react'
import {
  IndianRupee, DollarSign, TrendingDown, TrendingUp, Activity,
  Flame, PiggyBank, AlertOctagon, ChevronDown, Trash2, Calendar,
  Brain, Sliders, RefreshCw, Lock, Shield,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import SpendingPieChart from '../components/SpendingPieChart'
import MonthlyBarChart from '../components/MonthlyBarChart'
import AnomalyCard from '../components/AnomalyCard'
import ForecastCard from '../components/ForecastCard'
import UploadZone from '../components/UploadZone'
import HealthScoreGauge from '../components/HealthScoreGauge'
import WhatIfSimulator from '../components/WhatIfSimulator'
import BehavioralInsightsCard from '../components/BehavioralInsightsCard'
import RecurringPaymentsCard from '../components/RecurringPaymentsCard'
import {
  getDashboard, getForecast, getAnomalies, getSessions, deleteSession,
  getHealthScore, getInsights, getRecurring,
} from '../api/client'
import toast from 'react-hot-toast'

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-96">
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid #1E1E2E',
          borderTopColor: '#6C63FF',
          borderRadius: '50%',
        }}
        className="animate-spin"
      />
    </div>
  )
}

function InsightCard({ icon: Icon, label, value, color = '#6C63FF' }) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: '#111118', border: '1px solid #1E1E2E' }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          background: `${color}18`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={15} color={color} />
      </div>
      <div className="min-w-0">
        <p style={{ color: '#6B6B8A', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <p className="truncate" style={{ color: '#E8E8F0', fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
          {value}
        </p>
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, icon: Icon, iconColor = '#6C63FF', children }) {
  return (
    <div className="dark-card-static p-6">
      <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
        <div
          style={{
            width: '30px',
            height: '30px',
            background: `${iconColor}18`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={14} color={iconColor} />
        </div>
        <div>
          <p style={{ color: '#E8E8F0', fontSize: '13px', fontWeight: 700 }}>{title}</p>
          {subtitle && <p style={{ color: '#3A3A5C', fontSize: '11px', marginTop: '2px' }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function PrivacyBadge() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        display: 'inline-flex',
        gap: '6px',
        padding: expanded ? '10px 14px' : '6px 12px',
        background: 'rgba(0,212,170,0.06)',
        border: '1px solid rgba(0,212,170,0.2)',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexDirection: expanded ? 'column' : 'row',
        alignItems: expanded ? 'flex-start' : 'center',
      }}
      onClick={() => setExpanded((v) => !v)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Shield size={12} color="#00D4AA" />
        <span style={{ color: '#00D4AA', fontSize: '11px', fontWeight: 600 }}>Privacy First</span>
        <ChevronDown
          size={11}
          color="#00D4AA"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        />
      </div>
      {expanded && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            'All processing happens on your local machine',
            'Bank statement deleted after parsing',
            'Only Gemini API receives text for categorization',
            'No data stored on external servers',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '5px', height: '5px', background: '#00D4AA', borderRadius: '50%', flexShrink: 0 }} />
              <span style={{ color: '#6B6B8A', fontSize: '11px' }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SessionDropdown({ sessions, selectedId, onSelect, onRemove }) {
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
          borderRadius: '10px',
          color: '#E8E8F0',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif',
          minWidth: '180px',
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
            minWidth: '240px',
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
              <div
                key={s.id}
                className="flex items-center gap-2"
                style={{
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(108,99,255,0.1)' : 'transparent',
                  marginBottom: '2px',
                }}
              >
                <button
                  onClick={() => { onSelect(s.id); setOpen(false) }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: isSelected ? '#6C63FF' : '#E8E8F0', fontSize: '13px', fontWeight: 600 }}>
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
                  <span style={{ color: '#3A3A5C', fontSize: '11px', marginLeft: 'auto' }}>
                    {s.transaction_count} txns
                  </span>
                </button>
                <button
                  title="Remove this statement"
                  onClick={(e) => { e.stopPropagation(); onRemove(s.id) }}
                  style={{
                    padding: '6px 8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,71,87,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Trash2 size={12} color="#FF4757" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [healthScore, setHealthScore] = useState(null)
  const [insights, setInsights] = useState([])
  const [recurring, setRecurring] = useState(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)

  const loadDashboardData = async (sid) => {
    const [d, f, a, hs, ins, rec] = await Promise.all([
      getDashboard(sid),
      getForecast(sid),
      getAnomalies(sid),
      getHealthScore(sid),
      getInsights(sid),
      getRecurring(sid),
    ])
    setDashboard(d.data)
    setForecast(f.data)
    setAnomalies(a.data)
    setHealthScore(hs.data)
    setInsights(ins.data?.insights ?? [])
    setRecurring(rec.data)
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const sessRes = await getSessions()
        const list = sessRes.data
        setSessions(list)
        const latestId = list[0]?.id ?? null
        setSelectedId(latestId)
        await loadDashboardData(latestId)
      } catch (err) {
        console.error('Dashboard init error', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleSessionChange = async (newId) => {
    setSelectedId(newId)
    setLoading(true)
    try {
      await loadDashboardData(newId)
    } catch (err) {
      console.error('Session change error', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (sid) => {
    const session = sessions.find((s) => s.id === sid)
    const label = session?.statement_period ?? `Session ${sid}`
    if (!confirm(`Remove "${label}" and all its transactions? This cannot be undone.`)) return
    try {
      await deleteSession(sid)
      toast.success(`Removed ${label}`)
      const sessRes = await getSessions()
      const list = sessRes.data
      setSessions(list)
      const nextId = list[0]?.id ?? null
      setSelectedId(nextId)
      setLoading(true)
      await loadDashboardData(nextId)
    } catch (err) {
      toast.error('Failed to remove session')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = async () => {
    try {
      const sessRes = await getSessions()
      const list = sessRes.data
      setSessions(list)
      const latestId = list[0]?.id ?? null
      setSelectedId(latestId)
      setLoading(true)
      await loadDashboardData(latestId)
    } catch (err) {
      console.error('Post-upload refresh error', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  const hasData = sessions.length > 0 && (dashboard?.transaction_count ?? 0) > 0
  const cur = dashboard?.currency_symbol ?? '$'
  const CurrencyIcon = cur === '₹' ? IndianRupee : DollarSign

  const topCategory = dashboard
    ? Object.entries(dashboard.categories ?? {}).sort(([, a], [, b]) => b - a)[0]
    : null
  const savingsRate =
    dashboard && dashboard.total_income > 0
      ? ((dashboard.total_income - dashboard.total_expenses) / dashboard.total_income * 100).toFixed(0)
      : null

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="page-enter" style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ color: '#E8E8F0', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.4px' }}>
              Dashboard
            </h1>
            <p style={{ color: '#3A3A5C', fontSize: '12px', marginTop: '4px', fontWeight: 500 }}>
              {today}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <PrivacyBadge />
            {sessions.length > 0 && (
              <SessionDropdown
                sessions={sessions}
                selectedId={selectedId}
                onSelect={handleSessionChange}
                onRemove={handleDeleteSession}
              />
            )}
            {hasData && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: '#111118', border: '1px solid #1E1E2E' }}
              >
                <div style={{ width: '6px', height: '6px', background: '#00D4AA', borderRadius: '50%' }} className="animate-pulse" />
                <span style={{ color: '#6B6B8A', fontSize: '11px', fontWeight: 500 }}>Live data</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!hasData && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: '#111118',
            border: '1px solid #1E1E2E',
            maxWidth: '480px',
            margin: '60px auto 0',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              background: 'rgba(108,99,255,0.12)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <TrendingUp size={26} color="#6C63FF" />
          </div>
          <h2 style={{ color: '#E8E8F0', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            Welcome to Finance Tracker
          </h2>
          <p style={{ color: '#6B6B8A', fontSize: '13px', lineHeight: 1.6, marginBottom: '24px' }}>
            Upload your bank statement PDF below to automatically parse transactions,
            detect spending patterns, and unlock AI-powered financial insights.
          </p>
          <UploadZone onSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* Dashboard content */}
      {hasData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Income"
              value={`${cur}${dashboard.total_income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              color="teal"
            />
            <StatCard
              title="Total Expenses"
              value={`${cur}${dashboard.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingDown}
              color="red"
            />
            <StatCard
              title="Net Balance"
              value={`${dashboard.net_balance >= 0 ? '+' : ''}${cur}${Math.abs(dashboard.net_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={CurrencyIcon}
              color={dashboard.net_balance >= 0 ? 'teal' : 'red'}
            />
            <StatCard
              title="Transactions"
              value={dashboard.transaction_count}
              icon={Activity}
              color="purple"
              subtitle={anomalies.length ? `${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'} flagged` : 'All clear'}
            />
          </div>

          {/* Insights Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InsightCard
              icon={Flame}
              label="Top Spend Category"
              value={topCategory ? `${topCategory[0]} · ${cur}${topCategory[1].toLocaleString('en-IN', { minimumFractionDigits: 0 })}` : 'No data'}
              color="#FF4757"
            />
            <InsightCard
              icon={PiggyBank}
              label="Savings Rate"
              value={savingsRate !== null ? `${savingsRate}% of income saved` : 'No income data'}
              color="#00D4AA"
            />
            <InsightCard
              icon={AlertOctagon}
              label="Anomalies Detected"
              value={anomalies.length ? `${anomalies.length} unusual transaction${anomalies.length !== 1 ? 's' : ''}` : 'None — all clear!'}
              color={anomalies.length ? '#FFB800' : '#00D4AA'}
            />
          </div>

          {/* Health Score + AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard
              title="Financial Health Score"
              subtitle="Based on savings, consistency, balance & anomalies"
              icon={Activity}
              iconColor={healthScore?.color ?? '#6C63FF'}
            >
              <HealthScoreGauge
                score={healthScore?.score ?? 0}
                grade={healthScore?.grade ?? 'No Data'}
                color={healthScore?.color ?? '#6B6B8A'}
                breakdown={healthScore?.breakdown ?? {}}
              />
            </SectionCard>

            <SectionCard
              title="AI Spending Insights"
              subtitle="Behavioral patterns detected in your transactions"
              icon={Brain}
              iconColor="#6C63FF"
            >
              <BehavioralInsightsCard insights={insights} loading={false} />
            </SectionCard>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="dark-card-static p-6">
              <p style={{ color: '#E8E8F0', fontSize: '13px', fontWeight: 700, marginBottom: '3px' }}>
                Spending by Category
              </p>
              <p style={{ color: '#3A3A5C', fontSize: '11px', marginBottom: '16px' }}>
                Where your money is going
              </p>
              <SpendingPieChart categories={dashboard.categories} currency={cur} />
            </div>
            <div className="dark-card-static p-6">
              <p style={{ color: '#E8E8F0', fontSize: '13px', fontWeight: 700, marginBottom: '3px' }}>
                Monthly Overview
              </p>
              <p style={{ color: '#3A3A5C', fontSize: '11px', marginBottom: '16px' }}>
                Income vs expenses by month
              </p>
              <MonthlyBarChart data={dashboard.monthly_data} currency={cur} />
            </div>
          </div>

          {/* What If Simulator + Recurring Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard
              title="What If Simulator"
              subtitle="Adjust spending to see projected savings"
              icon={Sliders}
              iconColor="#A78BFA"
            >
              <WhatIfSimulator
                categories={dashboard.categories ?? {}}
                monthsCount={dashboard.months_count ?? 1}
                totalIncome={dashboard.total_income ?? 0}
                currency={cur}
              />
            </SectionCard>

            <SectionCard
              title="Recurring Payments"
              subtitle="Automatically detected subscriptions and bills"
              icon={RefreshCw}
              iconColor="#06B6D4"
            >
              <RecurringPaymentsCard data={recurring} loading={false} />
            </SectionCard>
          </div>

          {/* Anomalies + Forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 dark-card-static p-6">
              <p style={{ color: '#E8E8F0', fontSize: '13px', fontWeight: 700, marginBottom: '3px' }}>
                Spending Anomalies
              </p>
              <p style={{ color: '#3A3A5C', fontSize: '11px', marginBottom: '16px' }}>
                Transactions that look unusual
              </p>
              <AnomalyCard anomalies={anomalies} currency={cur} />
            </div>
            <ForecastCard forecast={forecast} currency={cur} />
          </div>

          {/* Upload more */}
          <div className="dark-card-static p-5">
            <p style={{ color: '#6B6B8A', fontSize: '12px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Import More Data
            </p>
            <UploadZone onSuccess={handleUploadSuccess} />
          </div>

        </div>
      )}
    </div>
  )
}
