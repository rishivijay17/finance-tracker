import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = [
  '#6C63FF', '#00D4AA', '#FF4757', '#FFB800',
  '#4A8FFF', '#FF6B9D', '#A78BFA', '#34D399',
]

const RADIAN = Math.PI / 180

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
      fontFamily="Inter, system-ui, sans-serif"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const tooltipStyle = {
  background: '#1A1A24',
  border: '1px solid #1E1E2E',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#E8E8F0',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
}

export default function SpendingPieChart({ categories, currency = '$' }) {
  const data = Object.entries(categories)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-52" style={{ color: '#3A3A5C', fontSize: '13px' }}>
        No spending data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={270}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={CustomLabel}
          outerRadius={100}
          dataKey="value"
          strokeWidth={2}
          stroke="#111118"
          isAnimationActive={true}
          animationBegin={0}
          animationDuration={600}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [`${currency}${Number(v).toFixed(2)}`, 'Spent']}
          contentStyle={tooltipStyle}
          labelStyle={{ color: '#6B6B8A', marginBottom: '2px' }}
          itemStyle={{ color: '#E8E8F0' }}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: '11px', color: '#6B6B8A', paddingTop: '10px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
