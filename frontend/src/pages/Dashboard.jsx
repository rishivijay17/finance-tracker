import { useState, useEffect, useCallback } from 'react'
import { DollarSign, TrendingDown, TrendingUp, Activity } from 'lucide-react'
import StatCard from '../components/StatCard'
import SpendingPieChart from '../components/SpendingPieChart'
import MonthlyBarChart from '../components/MonthlyBarChart'
import AnomalyCard from '../components/AnomalyCard'
import ForecastCard from '../components/ForecastCard'
import UploadZone from '../components/UploadZone'
import { getDashboard, getForecast, getAnomalies } from '../api/client'

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-96">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [d, f, a] = await Promise.all([getDashboard(), getForecast(), getAnomalies()])
      setDashboard(d.data)
      setForecast(f.data)
      setAnomalies(a.data)
    } catch (err) {
      console.error('Dashboard load error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (loading) return <Spinner />

  const hasData = (dashboard?.transaction_count ?? 0) > 0

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your financial overview at a glance</p>
      </div>

      {/* Empty state — no data yet */}
      {!hasData && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center max-w-lg mx-auto mt-16">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome to Finance Tracker</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Upload your bank statement PDF below to automatically parse transactions,
            detect spending patterns, and get AI-powered insights.
          </p>
          <UploadZone onSuccess={fetchAll} />
        </div>
      )}

      {/* Dashboard content */}
      {hasData && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Income"
              value={`$${dashboard.total_income.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Total Expenses"
              value={`$${dashboard.total_expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              icon={TrendingDown}
              color="red"
            />
            <StatCard
              title="Net Balance"
              value={`${dashboard.net_balance >= 0 ? '+' : ''}$${Math.abs(dashboard.net_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              color={dashboard.net_balance >= 0 ? 'green' : 'red'}
            />
            <StatCard
              title="Transactions"
              value={dashboard.transaction_count}
              icon={Activity}
              color="indigo"
              subtitle={`${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'} flagged`}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-base font-semibold text-slate-800 mb-1">Spending by Category</h2>
              <p className="text-slate-400 text-xs mb-4">Where your money is going</p>
              <SpendingPieChart categories={dashboard.categories} />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-base font-semibold text-slate-800 mb-1">Monthly Overview</h2>
              <p className="text-slate-400 text-xs mb-4">Income vs expenses by month</p>
              <MonthlyBarChart data={dashboard.monthly_data} />
            </div>
          </div>

          {/* Anomalies + Forecast Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-base font-semibold text-slate-800 mb-1">Spending Anomalies</h2>
              <p className="text-slate-400 text-xs mb-4">Transactions that look unusual</p>
              <AnomalyCard anomalies={anomalies} />
            </div>
            <ForecastCard forecast={forecast} />
          </div>

          {/* Upload more */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Add Another Statement</h2>
            <UploadZone onSuccess={fetchAll} />
          </div>
        </div>
      )}
    </div>
  )
}
