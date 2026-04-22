import { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import './ResultsPanel.css'

const COLORS = ['#ffffff', '#bbbbbb', '#888888', '#555555', '#333333']
const COLORS_LIGHT = ['#111111', '#444444', '#777777', '#aaaaaa', '#cccccc']

function useIsDark() {
  return document.documentElement.getAttribute('data-theme') !== 'light'
}

export default function ResultsPanel({ categories, contestants, totalVotes, voteLog }) {
  const [selectedCat, setSelectedCat] = useState('all')
  const isDark = useIsDark()
  const colors = isDark ? COLORS : COLORS_LIGHT
  const mutedColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const tooltipStyle = {
    background: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
    borderRadius: 8, color: isDark ? '#fff' : '#000', fontSize: 13,
  }

  // Filter contestants by selected category
  const filteredContestants = selectedCat === 'all'
    ? contestants
    : contestants.filter(c => c.category_id === selectedCat)

  const currentCategory = categories.find(c => c.id === selectedCat)
  const sorted = [...filteredContestants].sort((a, b) => (b.votes || 0) - (a.votes || 0))
  const topVotes = sorted[0]?.votes || 0
  const catTotalVotes = sorted.reduce((s, c) => s + (c.votes || 0), 0)
  const displayTotal = selectedCat === 'all' ? totalVotes : catTotalVotes

  const pieData = sorted
    .filter(c => (c.votes || 0) > 0)
    .map((c, i) => ({ name: c.name, value: c.votes || 0, color: colors[i % colors.length] }))

  const barData = sorted.map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    votes: c.votes || 0,
  }))

  if (contestants.length === 0) {
    return (
      <div className="results">
        <div className="panel-header">
          <h1 className="panel-title">Results</h1>
          <p className="panel-sub">No contestants yet.</p>
        </div>
        <div className="empty-state">
          <span className="empty-icon">◎</span>
          <p>Add contestants and start voting to see results here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="results">
      {/* Header with category filter */}
      <div className="results-header">
        <div>
          <h1 className="panel-title">Results</h1>
          <p className="panel-sub">
            {selectedCat === 'all'
              ? `${totalVotes} vote${totalVotes !== 1 ? 's' : ''} across all categories`
              : `${catTotalVotes} vote${catTotalVotes !== 1 ? 's' : ''} in ${currentCategory?.name}`}
          </p>
        </div>
        <select
          className="cat-filter-select"
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Stat cards */}
      <div className="stat-row">
        <div className="stat-card glass-card">
          <span className="stat-label">Total Votes</span>
          <span className="stat-value">{displayTotal}</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Nominees</span>
          <span className="stat-value">{filteredContestants.length}</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Leader</span>
          <span className="stat-value stat-name">{sorted[0]?.name || '—'}</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Lead %</span>
          <span className="stat-value">
            {displayTotal > 0 ? Math.round(((sorted[0]?.votes || 0) / displayTotal) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Winner spotlight */}
      {displayTotal > 0 && sorted[0] && (sorted[0].votes || 0) > 0 && (
        <div className="winner-card glass-card">
          {sorted[0].image_url && (
            <img src={sorted[0].image_url} alt={sorted[0].name} className="winner-photo" />
          )}
          <div className="winner-info">
            <span className="winner-label">
              {selectedCat === 'all' ? 'Overall Leader' : `Leading in ${currentCategory?.name}`}
            </span>
            <span className="winner-name">{sorted[0].name}</span>
            <span className="winner-votes">
              {sorted[0].votes} vote{sorted[0].votes !== 1 ? 's' : ''} ·{' '}
              {Math.round(((sorted[0].votes || 0) / displayTotal) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="section">
        <h2 className="section-title">
          {selectedCat === 'all' ? 'Overall Leaderboard' : currentCategory?.name}
        </h2>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◎</span>
            <p>No nominees in this category yet.</p>
          </div>
        ) : (
          <div className="results-list">
            {sorted.map((c, i) => {
              const count = c.votes || 0
              const pct = displayTotal > 0 ? Math.round((count / displayTotal) * 100) : 0
              return (
                <div key={c.id} className={`result-row glass-card ${i === 0 && count > 0 ? 'leading' : ''}`}>
                  <div className="result-meta">
                    <div className="result-left">
                      {c.image_url && <img src={c.image_url} alt={c.name} className="result-thumb" />}
                      <span className="result-rank">#{i + 1}</span>
                      <span className="result-name">{c.name}</span>
                      {selectedCat === 'all' && (
                        <span className="result-cat-tag">
                          {categories.find(cat => cat.id === c.category_id)?.name}
                        </span>
                      )}
                    </div>
                    <div className="result-right">
                      <span className="result-pct">{pct}%</span>
                      <span className="result-count">{count} vote{count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: topVotes > 0 ? `${(count / topVotes) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Charts */}
      {displayTotal > 0 && sorted.length > 0 && (
        <div className="charts-row">
          <div className="chart-card glass-card">
            <h2 className="section-title">Vote Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: mutedColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: mutedColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {pieData.length > 0 && (
            <div className="chart-card glass-card">
              <h2 className="section-title">Share</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} votes`]} />
                  <Legend
                    iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ color: mutedColor, fontSize: 12 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
