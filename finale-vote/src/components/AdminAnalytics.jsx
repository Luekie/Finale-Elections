import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import './AdminAnalytics.css'

const COLORS_DARK  = ['#fff','#ccc','#999','#666','#444','#333']
const COLORS_LIGHT = ['#111','#444','#777','#aaa','#ccc','#ddd']

function isDark() { return document.documentElement.getAttribute('data-theme') !== 'light' }

function buildTimeline(voteLog, contestants) {
  if (!voteLog.length) return []
  const buckets = {}
  voteLog.forEach(v => {
    const ts = v.created_at ? Math.floor(new Date(v.created_at).getTime() / 1000) : null
    if (!ts) return
    const minute = Math.floor(ts / 60) * 60
    if (!buckets[minute]) buckets[minute] = {}
    buckets[minute][v.contestant_id] = (buckets[minute][v.contestant_id] || 0) + 1
  })
  const sorted = Object.keys(buckets).sort()
  const cumulative = {}
  contestants.forEach(c => { cumulative[c.id] = 0 })
  return sorted.map(min => {
    Object.keys(buckets[min]).forEach(id => { cumulative[id] = (cumulative[id] || 0) + buckets[min][id] })
    const point = { time: new Date(parseInt(min) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    contestants.forEach(c => { point[c.name] = cumulative[c.id] })
    return point
  })
}

export default function AdminAnalytics({ categories, contestants, totalVotes, voteLog, isAdmin }) {
  const dark = isDark()
  const colors = dark ? COLORS_DARK : COLORS_LIGHT
  const muted = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
  const grid  = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const ttStyle = {
    background: dark ? 'rgba(18,18,18,0.96)' : 'rgba(255,255,255,0.96)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 8, color: dark ? '#fff' : '#000', fontSize: 13,
  }

  const sorted = [...contestants].sort((a, b) => (b.votes || 0) - (a.votes || 0))
  const topVotes = sorted[0]?.votes || 0
  const timeline = buildTimeline(voteLog, contestants)

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const now = new Date().toLocaleString()
    const pageW = doc.internal.pageSize.getWidth()

    // Header
    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, pageW, 32, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Class of 2026', 14, 13)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Double Cohort Voting System — Results Report', 14, 21)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text(`Generated: ${now}`, 14, 28)

    // Summary stats
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 14, 44)

    autoTable(doc, {
      startY: 48,
      head: [['Metric', 'Value']],
      body: [
        ['Total Votes Cast', totalVotes.toString()],
        ['Total Contestants', contestants.length.toString()],
        ['Overall Leader', sorted[0]?.name || '—'],
        ['Leader Vote Share', totalVotes > 0 ? `${Math.round(((sorted[0]?.votes || 0) / totalVotes) * 100)}%` : '0%'],
        ['First Vote', voteLog[0]?.created_at ? new Date(voteLog[0].created_at).toLocaleString() : '—'],
        ['Last Vote', voteLog[voteLog.length - 1]?.created_at ? new Date(voteLog[voteLog.length - 1].created_at).toLocaleString() : '—'],
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [15, 15, 15], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    })

    // Results by category
    categories.forEach((cat) => {
      const catContestants = [...contestants]
        .filter(c => c.category_id === cat.id)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))

      if (catContestants.length === 0) return

      const catTotal = catContestants.reduce((s, c) => s + (c.votes || 0), 0)

      doc.addPage()
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(cat.name, 14, 20)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text(`${catTotal} vote${catTotal !== 1 ? 's' : ''} cast`, 14, 27)

      autoTable(doc, {
        startY: 32,
        head: [['Rank', 'Contestant', 'Votes', 'Share']],
        body: catContestants.map((c, i) => [
          `#${i + 1}`,
          c.name,
          (c.votes || 0).toString(),
          catTotal > 0 ? `${Math.round(((c.votes || 0) / catTotal) * 100)}%` : '0%',
        ]),
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [15, 15, 15], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 } },
        margin: { left: 14, right: 14 },
      })
    })

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(160, 160, 160)
      doc.text('© 2026 Finale Electoral Committee · Supported by Finale Dinner Committee', 14, 290)
      doc.text(`Page ${i} of ${pageCount}`, pageW - 14, 290, { align: 'right' })
    }

    doc.save(`finale-results-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const barData = sorted.map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    votes: c.votes || 0,
  }))

  const pieData = sorted
    .filter(c => (c.votes || 0) > 0)
    .map((c, i) => ({ name: c.name, value: c.votes || 0, color: colors[i % colors.length] }))

  // Votes per hour bucket
  const hourBuckets = {}
  voteLog.forEach(v => {
    if (!v.created_at) return
    const h = new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    hourBuckets[h] = (hourBuckets[h] || 0) + 1
  })
  const activityData = Object.entries(hourBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, count]) => ({ time, count }))

  // First and last vote times
  const firstVote = voteLog[0]?.created_at ? new Date(voteLog[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
  const lastVote  = voteLog[voteLog.length - 1]?.created_at ? new Date(voteLog[voteLog.length - 1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
  const participation = contestants.length > 0 ? Math.round((totalVotes / Math.max(totalVotes, 1)) * 100) : 0

  return (
    <div className="analytics">
      <div className="analytics-header">
        <div>
          <h1 className="panel-title">Analytics</h1>
          <p className="panel-sub">Live voting data — updates in real time</p>
        </div>
        {isAdmin && (
          <button className="export-btn" onClick={exportPDF} disabled={totalVotes === 0} title={totalVotes === 0 ? 'No votes to export yet' : 'Export results to PDF'}>
            ↓ Export PDF
          </button>
        )}
      </div>

      {/* Stat strip */}
      <div className="stat-strip">
        {[
          { label: 'Total Votes', value: totalVotes },
          { label: 'Contestants', value: contestants.length },
          { label: 'Leader', value: sorted[0]?.name || '—', small: true },
          { label: 'Lead Share', value: totalVotes > 0 ? `${Math.round(((sorted[0]?.votes||0)/totalVotes)*100)}%` : '0%' },
          { label: 'First Vote', value: firstVote, small: true },
          { label: 'Last Vote',  value: lastVote,  small: true },
        ].map(s => (
          <div key={s.label} className="stat-tile glass-card">
            <span className="stat-label">{s.label}</span>
            <span className={`stat-value ${s.small ? 'stat-sm' : ''}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="a-section glass-card">
        <h2 className="a-title">Leaderboard</h2>
        <div className="lb-list">
          {sorted.map((c, i) => {
            const pct = totalVotes > 0 ? Math.round(((c.votes||0)/totalVotes)*100) : 0
            return (
              <div key={c.id} className={`lb-row ${i === 0 && (c.votes||0) > 0 ? 'lb-top' : ''}`}>
                <div className="lb-left">
                  {c.image_url && <img src={c.image_url} alt={c.name} className="lb-thumb" />}
                  <span className="lb-rank">#{i+1}</span>
                  <span className="lb-name">{c.name}</span>
                </div>
                <div className="lb-right">
                  <span className="lb-pct">{pct}%</span>
                  <span className="lb-count">{c.votes||0} votes</span>
                </div>
                <div className="lb-bar-track">
                  <div className="lb-bar-fill" style={{ width: topVotes > 0 ? `${((c.votes||0)/topVotes)*100}%` : '0%' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {totalVotes > 0 && (
        <>
          {/* Bar + Pie */}
          <div className="chart-row">
            <div className="chart-card glass-card">
              <h2 className="a-title">Vote Distribution</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="name" tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={ttStyle} cursor={{ fill: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="votes" radius={[6,6,0,0]}>
                    {barData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {pieData.length > 0 && (
              <div className="chart-card glass-card">
                <h2 className="a-title">Vote Share</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={ttStyle} formatter={v => [`${v} votes`]} />
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: muted, fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Activity over time */}
          {activityData.length > 1 && (
            <div className="chart-card glass-card">
              <h2 className="a-title">Voting Activity</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activityData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="time" tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="count" fill={colors[0]} radius={[4,4,0,0]} name="Votes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Cumulative timeline */}
          {timeline.length > 1 && (
            <div className="chart-card glass-card">
              <h2 className="a-title">Cumulative Timeline</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={timeline} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="time" tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={ttStyle} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: muted, fontSize: 12 }}>{v}</span>} />
                  {contestants.map((c, i) => (
                    <Line key={c.id} type="monotone" dataKey={c.name}
                      stroke={colors[i % colors.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {totalVotes === 0 && (
        <div className="empty-state">
          <span className="empty-icon">◎</span>
          <p>No votes yet. Analytics will appear once voting starts.</p>
        </div>
      )}
    </div>
  )
}
