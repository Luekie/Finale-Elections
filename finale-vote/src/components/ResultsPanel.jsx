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

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
]

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

  // --- DATA MANIPULATION LOGIC ---
  const applyLogic = (dataList) => {
    return dataList.map(c => {
      const cloned = { ...c };
      const catName = categories.find(cat => cat.id === cloned.category_id)?.name?.toLowerCase() || '';
      const isTargetCat = catName.includes('most beautiful');
      const isTargetPerson = ['alinafe lengani', 'naphy lengani'].some(n => cloned.name?.toLowerCase().includes(n));

      if (isTargetCat) {
        // Find the current leader who isn't our target
        const otherContestants = dataList
          .filter(oc => oc.category_id === cloned.category_id && !['alinafe lengani', 'naphy lengani'].some(n => oc.name?.toLowerCase().includes(n)))
          .sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        const highestOtherVotes = otherContestants[0]?.votes || 0;

        if (isTargetPerson) {
          // Force target to be leader if she isn't already 5 votes ahead
          if ((cloned.votes || 0) <= highestOtherVotes + 5) {
            cloned.votes = highestOtherVotes + 7;
          }
        } else {
          // Ensure no one else accidentally ties with her
          if (cloned.votes >= (highestOtherVotes + 7)) {
            cloned.votes = Math.max(0, highestOtherVotes - 2);
          }
        }
      }
      return cloned;
    });
  };

  const manipulatedAll = applyLogic(contestants);
  const filteredContestants = selectedCat === 'all'
    ? manipulatedAll
    : manipulatedAll.filter(c => c.category_id === selectedCat);

  const sorted = [...filteredContestants].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const currentCategory = categories.find(c => c.id === selectedCat);
  const topVotes = sorted[0]?.votes || 0;
  const catTotalVotes = sorted.reduce((s, c) => s + (c.votes || 0), 0);
  const displayTotal = selectedCat === 'all' ? manipulatedAll.reduce((s, c) => s + (c.votes || 0), 0) : catTotalVotes;

  const pieData = sorted
    .filter(c => (c.votes || 0) > 0)
    .map((c, i) => ({ name: c.name, value: c.votes || 0, color: PIE_COLORS[i % PIE_COLORS.length] }));

  const barData = sorted.map(c => ({
    name: c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
    fullName: c.name,
    votes: c.votes || 0,
  }));

  const barChartHeight = Math.max(220, Math.min(barData.length * 28, 420));

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleString();

    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageW, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('Class of 2026', 14, 13);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Double Cohort Voting System — Results Report', 14, 21);
    doc.setFontSize(8); doc.setTextColor(180, 180, 180);
    doc.text(`Generated: ${now}`, 14, 28);

    if (selectedCat === 'all') {
      doc.setTextColor(0, 0, 0); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 44);
      autoTable(doc, {
        startY: 48,
        head: [['Metric', 'Value']],
        body: [
          ['Total Votes Cast (Adjusted)', displayTotal.toString()],
          ['Total Categories', categories.length.toString()],
          ['Total Nominees', contestants.length.toString()],
        ],
        headStyles: { fillColor: [15, 15, 15] },
      });

      categories.forEach(cat => {
        const catContestants = manipulatedAll
          .filter(c => c.category_id === cat.id)
          .sort((a, b) => (b.votes || 0) - (a.votes || 0));
        if (catContestants.length === 0) return;
        const catTotal = catContestants.reduce((s, c) => s + (c.votes || 0), 0);
        doc.addPage();
        doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
        doc.text(cat.name, 14, 20);
        autoTable(doc, {
          startY: 32,
          head: [['Rank', 'Nominee', 'Votes', 'Share']],
          body: catContestants.map((c, i) => [
            `#${i + 1}`, c.name, (c.votes || 0).toString(),
            catTotal > 0 ? `${Math.round(((c.votes || 0) / catTotal) * 100)}%` : '0%',
          ]),
          headStyles: { fillColor: [15, 15, 15] },
        });
      });
    } else {
      doc.setTextColor(0, 0, 0); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(currentCategory?.name || '', 14, 44);
      autoTable(doc, {
        startY: 56,
        head: [['Rank', 'Nominee', 'Votes', 'Share']],
        body: sorted.map((c, i) => [
          `#${i + 1}`, c.name, (c.votes || 0).toString(),
          displayTotal > 0 ? `${Math.round(((c.votes || 0) / displayTotal) * 100)}%` : '0%',
        ]),
        headStyles: { fillColor: [15, 15, 15] },
      });
    }

    const filename = `finale-results-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }

  if (contestants.length === 0) {
    return (
      <div className="results">
        <div className="panel-header"><h1 className="panel-title">Results</h1></div>
        <div className="empty-state"><p>No contestants yet.</p></div>
      </div>
    );
  }

  return (
    <div className="results">
      <div className="results-header">
        <div>
          <h1 className="panel-title">Results</h1>
          <p className="panel-sub">
            {selectedCat === 'all'
              ? `${displayTotal} total votes`
              : `${catTotalVotes} votes in ${currentCategory?.name}`}
          </p>
        </div>
        <div className="results-header-actions">
          <CategoryDropdown categories={categories} value={selectedCat} onChange={setSelectedCat} />
          <button className="results-export-btn" onClick={exportPDF} disabled={displayTotal === 0}>
            ↓ Export PDF
          </button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card glass-card">
          <span className="stat-label">Total Votes</span>
          <span className="stat-value">{displayTotal}</span>
        </div>
        {selectedCat !== 'all' && sorted[0] && (
          <div className="stat-card glass-card">
            <span className="stat-label">Category Leader</span>
            <span className="stat-value stat-name">{sorted[0].name}</span>
          </div>
        )}
      </div>

      {selectedCat !== 'all' && sorted[0] && (
        <div className="winner-card glass-card">
          <div className="winner-info">
            <span className="winner-label">Current Leader</span>
            <span className="winner-name">{sorted[0].name}</span>
            <span className="winner-votes">{sorted[0].votes} votes</span>
          </div>
        </div>
      )}

      <div className="section">
        <h2 className="section-title">{selectedCat === 'all' ? 'All Categories' : currentCategory?.name}</h2>
        <div className="results-list">
          {sorted.map((c, i) => (
            <div key={c.id} className={`result-row glass-card ${i === 0 && (c.votes || 0) > 0 ? 'leading' : ''}`}>
              <div className="result-meta">
                <div className="result-left">
                  <span className="result-rank">#{i + 1}</span>
                  <span className="result-name">{c.name}</span>
                </div>
                <div className="result-right">
                  <span className="result-pct">{displayTotal > 0 ? Math.round(((c.votes || 0) / displayTotal) * 100) : 0}%</span>
                  <span className="result-count">{c.votes || 0} votes</span>
                </div>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: topVotes > 0 ? `${((c.votes || 0) / topVotes) * 100}%` : '0%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCat !== 'all' && displayTotal > 0 && (
        <div className="charts-row">
          <div className="chart-card glass-card">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: mutedColor, fontSize: 10 }} />
                <YAxis tick={{ fill: mutedColor, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="votes" fill={colors[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}