import { useState } from 'react'
import './VotingPanel.css'

export default function VotingPanel({
  categories, contestants, votingOpen,
  hasVotedInCategory, votedForInCategory, onVote
}) {
  const [activeCat, setActiveCat] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const totalCats = categories.length
  const votedCount = categories.filter(c => hasVotedInCategory(c.id)).length

  // ── Voting closed ──
  if (!votingOpen) {
    return (
      <div className="voting">
        <div className="vote-closed-wrap glass-card">
          <span className="vote-closed-icon">🔒</span>
          <h2 className="vote-closed-title">Voting is Closed</h2>
          <p className="vote-closed-sub">The Electoral Committee hasn't opened voting yet.<br />Please check back soon.</p>
        </div>
      </div>
    )
  }

  const currentCat = categories.find(c => c.id === activeCat)
  const catContestants = activeCat ? contestants.filter(c => c.category_id === activeCat) : []
  const selectedContestant = catContestants.find(c => c.id === selected)

  const handleSelectCategory = (catId) => {
    setActiveCat(catId)
    setSelected(null)
    setConfirming(false)
  }

  const handleSelectContestant = (id) => {
    if (hasVotedInCategory(activeCat) || submitting) return
    setSelected(id)
    setConfirming(true)
  }

  const handleConfirm = async () => {
    if (!selected || submitting) return
    setSubmitting(true)
    try {
      await onVote(activeCat, selected)
      setConfirming(false)
      setSelected(null)
    } catch { /* keep confirming open */ }
    finally { setSubmitting(false) }
  }

  const handleCancel = () => { setSelected(null); setConfirming(false) }

  // ── Category list view ──
  if (!activeCat) {
    return (
      <div className="voting">
        <div className="vote-hero">
          <h1 className="vote-hero-title">Cast Your Votes</h1>
          <p className="vote-hero-sub">Class of 2026 — Double Cohort · {votedCount} of {totalCats} categories voted</p>
          {totalCats > 0 && (
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${(votedCount / totalCats) * 100}%` }} />
            </div>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◎</span>
            <p>No categories yet. Check back soon.</p>
          </div>
        ) : (
          <div className="cat-grid">
            {categories.map((cat, i) => {
              const voted = hasVotedInCategory(cat.id)
              const votedId = votedForInCategory(cat.id)
              const votedFor = contestants.find(c => c.id === votedId)
              const count = contestants.filter(c => c.category_id === cat.id).length
              return (
                <button
                  key={cat.id}
                  className={`cat-vote-card glass-card ${voted ? 'cat-voted' : ''}`}
                  onClick={() => handleSelectCategory(cat.id)}
                >
                  <div className="cat-vote-top">
                    <span className="cat-vote-num">{String(i + 1).padStart(2, '0')}</span>
                    {voted && <span className="cat-voted-check">✓</span>}
                  </div>
                  <span className="cat-vote-name">{cat.name}</span>
                  {voted && votedFor ? (
                    <span className="cat-voted-for">Voted: {votedFor.name}</span>
                  ) : (
                    <span className="cat-vote-count">{count} nominee{count !== 1 ? 's' : ''}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Confirmation screen ──
  if (confirming && selectedContestant) {
    return (
      <div className="voting">
        <button className="back-btn" onClick={handleCancel}>← Back</button>
        <div className="confirm-overlay">
          <div className="confirm-modal glass-card">
            <p className="confirm-cat-label">{currentCat?.name}</p>
            <p className="confirm-label">You're about to vote for</p>
            {selectedContestant.image_url
              ? <img src={selectedContestant.image_url} alt={selectedContestant.name} className="confirm-photo" />
              : <div className="confirm-avatar">{selectedContestant.name.charAt(0).toUpperCase()}</div>
            }
            <h2 className="confirm-name">{selectedContestant.name}</h2>
            <p className="confirm-warning">This cannot be undone. You only get one vote per category.</p>
            <div className="confirm-actions">
              <button className="btn-confirm" onClick={handleConfirm} disabled={submitting}>
                {submitting ? <span className="btn-spinner" /> : 'Confirm Vote'}
              </button>
              <button className="btn-cancel-vote" onClick={handleCancel} disabled={submitting}>Go back</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Contestant grid for selected category ──
  const alreadyVoted = hasVotedInCategory(activeCat)
  const myVoteId = votedForInCategory(activeCat)

  return (
    <div className="voting">
      <button className="back-btn" onClick={() => setActiveCat(null)}>← All Categories</button>

      <div className="vote-hero">
        <p className="vote-cat-label">Category</p>
        <h1 className="vote-hero-title">{currentCat?.name}</h1>
        <p className="vote-hero-sub">
          {alreadyVoted ? 'Your vote has been recorded for this category' : 'Select a nominee to vote'}
        </p>
      </div>

      {alreadyVoted && (
        <div className="voted-banner glass-card">
          <span>✓</span>
          <span>You voted for <strong>{contestants.find(c => c.id === myVoteId)?.name}</strong></span>
        </div>
      )}

      {catContestants.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">◎</span>
          <p>No nominees added for this category yet.</p>
        </div>
      ) : (
        <div className="vote-grid">
          {catContestants.map((c, i) => {
            const isVoted = myVoteId === c.id
            return (
              <button
                key={c.id}
                className={`vote-card ${isVoted ? 'voted' : ''} ${alreadyVoted && !isVoted ? 'dimmed' : ''}`}
                onClick={() => handleSelectContestant(c.id)}
                disabled={alreadyVoted}
                aria-label={`Vote for ${c.name}`}
              >
                {c.image_url
                  ? <div className="vote-photo-wrap">
                      <img src={c.image_url} alt={c.name} className="vote-photo" />
                      {isVoted && <div className="vote-photo-overlay">✓</div>}
                    </div>
                  : <div className="vote-avatar">{c.name.charAt(0).toUpperCase()}</div>
                }
                <span className="vote-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="vote-name">{c.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
