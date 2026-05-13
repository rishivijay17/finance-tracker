import { useState, useEffect } from 'react'
import { Sliders } from 'lucide-react'

export default function WhatIfSimulator({ categories = {}, monthsCount = 1, totalIncome = 0, currency = '₹' }) {
  const availableCategories = Object.entries(categories)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)

  const [selectedCategory, setSelectedCategory] = useState('')
  const [reduction, setReduction] = useState(20)

  useEffect(() => {
    if (availableCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(availableCategories[0][0])
    }
  }, [availableCategories.length])

  if (availableCategories.length === 0) {
    return (
      <div style={{ color: '#3A3A5C', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
        Upload a statement to use the simulator.
      </div>
    )
  }

  const totalSpend = categories[selectedCategory] || 0
  const monthlySpend = totalSpend / Math.max(monthsCount, 1)
  const monthlySavings = monthlySpend * (reduction / 100)
  const annualSavings = monthlySavings * 12

  const currentMonthlySavings = totalIncome > 0
    ? (totalIncome - Object.values(categories).reduce((a, b) => a + b, 0)) / Math.max(monthsCount, 1)
    : 0
  const newMonthlySavings = currentMonthlySavings + monthlySavings
  const monthsToTarget = newMonthlySavings > 0 ? Math.ceil(100000 / newMonthlySavings) : null

  const subscriptionSavings = (categories['Utilities'] || 0) / Math.max(monthsCount, 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={{ color: '#6B6B8A', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              background: '#16161F',
              border: '1px solid #1E1E2E',
              color: '#E8E8F0',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {availableCategories.map(([cat]) => (
              <option key={cat} style={{ background: '#16161F' }}>{cat}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 2, minWidth: '180px' }}>
          <label style={{ color: '#6B6B8A', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
            Reduce spending by <span style={{ color: '#6C63FF' }}>{reduction}%</span>
          </label>
          <input
            type="range"
            min={5}
            max={80}
            step={5}
            value={reduction}
            onChange={(e) => setReduction(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#6C63FF',
              cursor: 'pointer',
              height: '4px',
            }}
          />
          <div className="flex justify-between" style={{ marginTop: '4px' }}>
            <span style={{ color: '#3A3A5C', fontSize: '10px' }}>5%</span>
            <span style={{ color: '#3A3A5C', fontSize: '10px' }}>80%</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <ResultTile
          label="Monthly Savings"
          value={`${currency}${monthlySavings.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          color="#6C63FF"
        />
        <ResultTile
          label="Annual Savings"
          value={`${currency}${annualSavings.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          color="#00D4AA"
        />
        {monthsToTarget && monthsToTarget < 360 && (
          <ResultTile
            label={`Reach ${currency}1,00,000`}
            value={`${monthsToTarget} months`}
            color="#FFB800"
          />
        )}
        {subscriptionSavings > 0 && selectedCategory !== 'Utilities' && (
          <ResultTile
            label="Cancel Subscriptions"
            value={`Save ${currency}${(subscriptionSavings * 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/yr`}
            color="#FF6B3D"
            subtitle="if all cancelled"
          />
        )}
      </div>

      <p style={{ color: '#3A3A5C', fontSize: '11px', marginTop: '2px' }}>
        Based on {currency}{monthlySpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month in {selectedCategory} over {monthsCount} month{monthsCount !== 1 ? 's' : ''}.
      </p>
    </div>
  )
}

function ResultTile({ label, value, color, subtitle }) {
  return (
    <div
      style={{
        background: `${color}0D`,
        border: `1px solid ${color}25`,
        borderRadius: '10px',
        padding: '12px 14px',
      }}
    >
      <p style={{ color: '#6B6B8A', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        {label}
      </p>
      <p style={{ color, fontSize: '16px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {subtitle && (
        <p style={{ color: '#3A3A5C', fontSize: '10px', marginTop: '2px' }}>{subtitle}</p>
      )}
    </div>
  )
}
