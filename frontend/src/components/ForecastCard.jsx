import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

export default function ForecastCard({ forecast }) {
  if (!forecast) return null

  const {
    current_month_spending,
    projected_month_spending,
    days_elapsed,
    days_remaining,
    daily_rate,
    alert,
  } = forecast

  const isWarning = projected_month_spending > current_month_spending * 1.1

  return (
    <div
      className={`rounded-xl p-5 border h-full ${
        isWarning
          ? 'bg-red-50 border-red-200'
          : 'bg-indigo-50 border-indigo-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={15} className={isWarning ? 'text-red-600' : 'text-indigo-600'} />
        <h3
          className={`text-sm font-semibold ${
            isWarning ? 'text-red-800' : 'text-indigo-800'
          }`}
        >
          Month-End Forecast
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500">Spent so far</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">
            ${current_month_spending.toFixed(0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Projected total</p>
          <p
            className={`text-xl font-bold mt-0.5 ${
              isWarning ? 'text-red-700' : 'text-indigo-700'
            }`}
          >
            ${projected_month_spending.toFixed(0)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        {isWarning ? (
          <TrendingUp size={13} className="text-red-500" />
        ) : (
          <TrendingDown size={13} className="text-emerald-500" />
        )}
        <span>
          ${daily_rate.toFixed(0)}/day · {days_elapsed} days elapsed · {days_remaining} remaining
        </span>
      </div>

      {alert && (
        <p
          className={`text-xs pt-3 border-t font-medium leading-relaxed ${
            isWarning
              ? 'text-red-700 border-red-200'
              : 'text-indigo-700 border-indigo-200'
          }`}
        >
          {alert}
        </p>
      )}
    </div>
  )
}
