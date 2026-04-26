const colorMap = {
  indigo: { icon: 'text-indigo-600 bg-indigo-50', border: 'border-indigo-100' },
  green: { icon: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-100' },
  red: { icon: 'text-red-500 bg-red-50', border: 'border-red-100' },
  amber: { icon: 'text-amber-600 bg-amber-50', border: 'border-amber-100' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo' }) {
  const c = colorMap[color] ?? colorMap.indigo

  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border ${c.border}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.icon}`}>
            <Icon size={17} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
    </div>
  )
}
