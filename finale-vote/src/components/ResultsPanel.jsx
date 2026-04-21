import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend
} from 'recharts'
import './ResultsPanel.css'

const COLORS = ['#ffffff', '#bbbbbb', '#888888', '#555555', '#333333']
const COLORS_LIGHT = ['#111111', '#444444', '#777777', '#aaaaaa', '#cccccc']

function useIsDark() {
  return document.documentElement.getAttribute('data-theme') !== 'light'
}

function buildTimeline(voteLog, contestants) {
  if (!voteLog.length) return []
  const map = {}
  contestants.forEach(c => { map[c.id] = c.name })

  const buckets = {}
  voteLog.forEach(v => {
    const ts = v.created_at ? Math.floor(new Date(v.created_at).getTime() / 1000) : null
    if (!ts) return
    const minute = Math.floor(ts / 60) * 60
    if (!buckets[minute]) buckets[minute] = {}
    const cid = v.contestant_id
    buckets[minute][cid] = (buckets[minute][cid] || 0) + 1
  })

  const sorted = Object.keys(buckets).sort()
  const cumulative = {}
  contestants.forEach(c => { cumulative[c.id] = 0 })

  return sorted.map(min => {
    const bucket = buckets[min]
    Object.keys(bucket).forEach(id => { cumulative[id] = (cumulative[id] || 0) + bucket[id] })
    const point = {
      time: new Date(parseInt(min) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    contestants.forEach(c => { point[c.name] = cumulative[c.id] })
    return point
  })
}

export default function ResultsPanel({ categories, contestants, totalVotes, voteLog }) {
  const isDark = useIsDark()
  const colors = isDark ? COLORS : COLORS_LIGHT
  const sorted = [...contestants].sort((a, b) => (b.votes || 0) - (a.votes || 0))
  const topVotes = sorted[0] ? (sorted[0].votes || 0) : 0
  const timeline = buildTimeline(voteLog, contestants)

  const pieData = sorted
    .filter(c => (c.votes || 0) > 0)
    .map((c, i) => ({ name: c.name, value: c.votes || 0, color: colors[i % colors.length] }))

  const barData = sorted.map(c => ({
    name: c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
    votes: c.votes || 0,
  }))

  const mutedColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const tooltipStyle = {
    background: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
    borderRadius: 8,
    color: isDark ? '#fff' : '#000',
    fontSize: 13,
  }

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
      <div className="panel-header">
        <h1 className="panel-title">Results</h1>
        <p className="panel-sub">{totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast</p>
      </div>

      {/* Stat cards */}
      <div className="stat-row">
        <div className="stat-card glass-card">
          <span className="stat-label">Total Votes</span>
          <span className="stat-value">{totalVotes}</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Contestants</span>
          <span className="stat-value">{contestants.length}</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Leader</span>
          <span className="stat-value stat-name">{sorted[0]?.name || '—'}</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Lead %</span>
          <span className="stat-value">
            {totalVotes > 0 ? Math.round(((sorted[0]?.votes || 0) / totalVotes) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Winner spotlight */}
      {totalVotes > 0 && sorted[0] && (sorted[0].votes || 0) > 0 && (
        <div className="winner-card glass-card">
          {sorted[0].image_url && (
            <img src={sorted[0].image_url} alt={sorted[0].name} className="winner-photo" />
          )}
          <div className="winner-info">
            <span className="winner-label">Currently Leading</span>
            <span className="winner-name">{sorted[0].name}</span>
            <span className="winner-votes">
              {sorted[0].votes} vote{sorted[0].votes !== 1 ? 's' : ''} ·{' '}
              {Math.round(((sorted[0].votes || 0) / totalVotes) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="section">
        <h2 className="section-title">Leaderboard</h2>
        <div className="results-list">
          {sorted.map((c, i) => {
            const count = c.votes || 0
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            return (
              <div key={c.id} className={`result-row glass-card ${i === 0 && count > 0 ? 'leading' : ''}`}>
                <div className="result-meta">
                  <div className="result-left">
                    {c.image_url && <img src={c.image_url} alt={c.name} className="result-thumb" />}
                    <span className="result-rank">#{i + 1}</span>
                    <span className="result-name">{c.name}</span>
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
      </div>

      {/* Charts — only show when there are votes */}
      {totalVotes > 0 && (
        <>
          <div className="charts-row">
            {/* Bar chart */}
            <div className="chart-card glass-card">
              <h2 className="section-title">Vote Distribution</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fill: mutedColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: mutedColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            {pieData.length > 0 && (
              <div className="chart-card glass-card">
                <h2 className="section-title">Share</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} votes`]} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span style={{ color: mutedColor, fontSize: 12 }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Timeline */}
          {timeline.length > 1 && (
            <div className="chart-card glass-card">
              <h2 className="section-title">Vote Timeline</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={timeline} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="time" tick={{ fill: mutedColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: mutedColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ color: mutedColor, fontSize: 12 }}>{v}</span>}
                  />
                  {contestants.map((c, i) => (
                    <Line
                      key={c.id}
                      type="monotone"
                      dataKey={c.name}
                      stroke={colors[i % colors.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
