import { useState } from 'react'
import { AlertTriangle, Search } from 'lucide-react'

const CATEGORIES = [
  'All', 'Food', 'Transport', 'Shopping', 'Entertainment',
  'Bills', 'Health', 'Travel', 'Income', 'Transfer', 'Other',
]

const CAT_STYLE = {
  Food: 'bg-orange-100 text-orange-700',
  Transport: 'bg-blue-100 text-blue-700',
  Shopping: 'bg-purple-100 text-purple-700',
  Entertainment: 'bg-pink-100 text-pink-700',
  Bills: 'bg-red-100 text-red-700',
  Health: 'bg-green-100 text-green-700',
  Travel: 'bg-cyan-100 text-cyan-700',
  Income: 'bg-emerald-100 text-emerald-700',
  Transfer: 'bg-slate-100 text-slate-600',
  Other: 'bg-gray-100 text-gray-600',
}

export default function TransactionTable({ transactions }) {
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
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-100">
              <th className="pb-3 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">Date</th>
              <th className="pb-3 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">Description</th>
              <th className="pb-3 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">Category</th>
              <th className="pb-3 text-xs text-slate-400 font-semibold uppercase tracking-wider text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400 text-sm">
                  {transactions.length === 0
                    ? 'No transactions yet. Upload a bank statement to get started.'
                    : 'No transactions match your filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.id}
                  className={`group hover:bg-slate-50 transition-colors ${
                    t.is_anomaly ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <td className="py-3 pr-4 text-slate-400 text-xs whitespace-nowrap font-mono">
                    {t.date}
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <div className="flex items-center gap-2">
                      {t.is_anomaly && (
                        <AlertTriangle size={13} className="text-amber-500 shrink-0" title={t.anomaly_reason} />
                      )}
                      <span className="text-slate-800 truncate">{t.description}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        CAT_STYLE[t.category] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t.category}
                    </span>
                  </td>
                  <td
                    className={`py-3 text-right font-semibold tabular-nums ${
                      t.amount >= 0 ? 'text-emerald-600' : 'text-slate-800'
                    }`}
                  >
                    {t.amount >= 0 ? '+' : ''}
                    {t.amount.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="text-slate-400 text-xs mt-4">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          {category !== 'All' || search ? ` (filtered from ${transactions.length})` : ''}
        </p>
      )}
    </div>
  )
}
