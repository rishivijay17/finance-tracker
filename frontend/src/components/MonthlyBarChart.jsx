import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const tooltipStyle = {
  background: '#1A1A24',
  border: '1px solid #1E1E2E',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#E8E8F0',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
}

export default function MonthlyBarChart({ data, currency = '$' }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-52" style={{ color: '#3A3A5C', fontSize: '13px' }}>
        No monthly data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: '#6B6B8A', fontFamily: 'Inter, system-ui' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#6B6B8A', fontFamily: 'Inter, system-ui' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${currency}${v}`}
        />
        <Tooltip
          formatter={(v, name) => [`${currency}${Number(v).toFixed(2)}`, name]}
          contentStyle={tooltipStyle}
          labelStyle={{ color: '#6B6B8A', marginBottom: '4px', fontSize: '11px' }}
          itemStyle={{ color: '#E8E8F0' }}
          cursor={{ fill: 'rgba(108,99,255,0.06)' }}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: '11px', color: '#6B6B8A', paddingTop: '8px' }}
        />
        <Bar
          dataKey="income"
          fill="#00D4AA"
          name="Income"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
          isAnimationActive={true}
          animationDuration={600}
        />
        <Bar
          dataKey="expenses"
          fill="#6C63FF"
          name="Expenses"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
          isAnimationActive={true}
          animationDuration={600}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
