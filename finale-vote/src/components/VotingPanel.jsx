import { useState } from 'react'
import './VotingPanel.css'

export default function VotingPanel({
  categories, contestants, votingOpen,
  hasVotedInCategory, votedForInCategory,
  saveVote, saveAllVotes, votes
}) {
  const [tab, setTab] = useState('vote')
  const [activeCat, setActiveCat] = useState(null)
  // pending: local selections not yet saved { categoryId: contestantId }
  const [pending, setPending] = useState({})
  const [reviewing, setReviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  const totalCats = categories.length
  const savedCount = categories.filter(c => hasVotedInCategory(c.id)).length

  // All unsaved changes (pending differs from saved)
  const unsavedCount = Object.entries(pending).filter(
    ([catId, conId]) => votedForInCategory(catId) !== conId
  ).length

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

  // ── Review screen ──
  if (reviewing) {
    // Merge: saved votes + pending overrides
    const allSelections = { ...votes, ...pending }
    const reviewItems = categories
      .map(cat => {
        const chosenId = allSelections[cat.id]
        const chosen = contestants.find(c => c.id === chosenId)
        const savedId = votedForInCategory(cat.id)
        const isChange = savedId && savedId !== chosenId
        const isNew = !savedId && !!chosenId
        return { cat, chosen, isChange, isNew, isSaved: savedId === chosenId && !!savedId }
      })
      .filter(r => r.chosen)

    const toSave = reviewItems.filter(r => r.isNew || r.isChange)

    const handleSubmitAll = async () => {
      if (toSave.length === 0) { setReviewing(false); return }
      setSubmitting(true)
      try {
        const selections = {}
        toSave.forEach(r => { selections[r.cat.id] = r.chosen.id })
        await saveAllVotes(selections)
        setPending({})
        setLastSaved(new Date())
        setReviewing(false)
      } catch { /* keep open */ }
      finally { setSubmitting(false) }
    }

    return (
      <div className="voting">
        <button className="back-btn" onClick={() => setReviewing(false)}>← Back to voting</button>
        <div className="vote-hero">
          <h1 className="vote-hero-title">Review Your Choices</h1>
          <p className="vote-hero-sub">
            {toSave.length > 0
              ? `${toSave.length} selection${toSave.length !== 1 ? 's' : ''} to save`
              : 'All up to date — nothing to save'}
          </p>
        </div>

        <div className="review-list">
          {reviewItems.map(({ cat, chosen, isChange, isNew, isSaved }) => (
            <div key={cat.id} className={`review-row glass-card ${isSaved ? 'review-committed' : 'review-pending'}`}>
              <div className="review-left">
                {chosen.image_url
                  ? <img src={chosen.image_url} alt={chosen.name} className="review-thumb" />
                  : <div className="review-avatar">{chosen.name.charAt(0).toUpperCase()}</div>
                }
                <div className="review-info">
                  <span className="review-cat">{cat.name}</span>
                  <span className="review-name">{chosen.name}</span>
                </div>
              </div>
              <div className="review-status">
                {isSaved && <span className="review-badge committed">✓ Saved</span>}
                {isNew && <span className="review-badge pending">New</span>}
                {isChange && <span className="review-badge change">Changed</span>}
                <button className="review-change" onClick={() => {
                  setReviewing(false)
                  setActiveCat(cat.id)
                }}>Change</button>
              </div>
            </div>
          ))}
        </div>

        {toSave.length > 0 && (
          <button className="btn-submit-all" onClick={handleSubmitAll} disabled={submitting}>
            {submitting
              ? <span className="btn-spinner" />
              : `Save ${toSave.length} Vote${toSave.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    )
  }

  // ── My Votes tab ──
  if (tab === 'myvotes') {
    const myVotes = categories
      .map(cat => {
        const votedId = votedForInCategory(cat.id)
        const contestant = contestants.find(c => c.id === votedId)
        return { cat, contestant }
      })
      .filter(v => v.contestant)

    return (
      <div className="voting">
        <div className="vote-tabs">
          <button className={`vote-tab ${tab === 'vote' ? 'active' : ''}`} onClick={() => setTab('vote')}>Vote</button>
          <button className={`vote-tab ${tab === 'myvotes' ? 'active' : ''}`} onClick={() => setTab('myvotes')}>My Votes</button>
        </div>
        <div className="vote-hero">
          <h1 className="vote-hero-title">My Votes</h1>
          <p className="vote-hero-sub">{myVotes.length} of {totalCats} categories voted · voting is open, you can still change</p>
        </div>
        {myVotes.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◎</span>
            <p>You haven't voted yet. Go to the Vote tab to get started.</p>
          </div>
        ) : (
          <div className="myvotes-list">
            {myVotes.map(({ cat, contestant }) => (
              <div key={cat.id} className="myvote-row glass-card">
                <div className="myvote-left">
                  {contestant.image_url
                    ? <img src={contestant.image_url} alt={contestant.name} className="myvote-thumb" />
                    : <div className="myvote-avatar">{contestant.name.charAt(0).toUpperCase()}</div>
                  }
                  <div className="myvote-info">
                    <span className="myvote-cat">{cat.name}</span>
                    <span className="myvote-name">{contestant.name}</span>
                  </div>
                </div>
                <button className="myvote-change-btn" onClick={() => {
                  setTab('vote')
                  setActiveCat(cat.id)
                }}>
                  Change
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Category list ──
  if (!activeCat) {
    return (
      <div className="voting">
        <div className="vote-tabs">
          <button className={`vote-tab ${tab === 'vote' ? 'active' : ''}`} onClick={() => setTab('vote')}>Vote</button>
          <button className={`vote-tab ${tab === 'myvotes' ? 'active' : ''}`} onClick={() => setTab('myvotes')}>
            My Votes {savedCount > 0 && <span className="vote-tab-badge">{savedCount}</span>}
          </button>
        </div>

        {lastSaved && (
          <div className="submit-success glass-card">
            <span>✓</span>
            <span>Votes saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. You can still change them while voting is open.</span>
          </div>
        )}

        <div className="vote-hero">
          <h1 className="vote-hero-title">Cast Your Votes</h1>
          <p className="vote-hero-sub">Class of 2026 - Double Cohort · {savedCount} of {totalCats} categories voted</p>
          {totalCats > 0 && (
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${(savedCount / totalCats) * 100}%` }} />
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
              const savedId = votedForInCategory(cat.id)
              const pendingId = pending[cat.id]
              const hasChange = pendingId && pendingId !== savedId
              const displayId = pendingId || savedId
              const displayFor = contestants.find(c => c.id === displayId)
              const count = contestants.filter(c => c.category_id === cat.id).length
              return (
                <button
                  key={cat.id}
                  className={`cat-vote-card glass-card ${savedId ? 'cat-voted' : ''} ${hasChange ? 'cat-pending' : ''}`}
                  onClick={() => setActiveCat(cat.id)}
                >
                  <div className="cat-vote-top">
                    <span className="cat-vote-num">{String(i + 1).padStart(2, '0')}</span>
                    {savedId && !hasChange && <span className="cat-voted-check">✓</span>}
                    {hasChange && <span className="cat-pending-dot" />}
                  </div>
                  <span className="cat-vote-name">{cat.name}</span>
                  {displayFor ? (
                    <span className="cat-voted-for">
                      {hasChange ? '● ' : savedId ? '✓ ' : ''}{displayFor.name}
                    </span>
                  ) : (
                    <span className="cat-vote-count">{count} nominee{count !== 1 ? 's' : ''}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {unsavedCount > 0 && (
          <button className="btn-review" onClick={() => setReviewing(true)}>
            Review & Save {unsavedCount} Change{unsavedCount !== 1 ? 's' : ''} →
          </button>
        )}
      </div>
    )
  }

  // ── Contestant grid ──
  const currentCat = categories.find(c => c.id === activeCat)
  const catContestants = contestants.filter(c => c.category_id === activeCat)
  const savedId = votedForInCategory(activeCat)
  const pendingId = pending[activeCat]
  // Active selection: pending takes priority over saved
  const activeId = pendingId !== undefined ? pendingId : savedId

  const handleSelect = (id) => {
    if (submitting) return
    setPending(prev => ({ ...prev, [activeCat]: id }))
  }

  const handleSaveThis = async () => {
    if (!activeId || submitting) return
    setSubmitting(true)
    try {
      await saveVote(activeCat, activeId)
      setPending(prev => { const n = { ...prev }; delete n[activeCat]; return n })
      setLastSaved(new Date())
      setActiveCat(null)
    } catch { /* keep open */ }
    finally { setSubmitting(false) }
  }

  const hasUnsavedChange = activeId && activeId !== savedId

  return (
    <div className="voting">
      <button className="back-btn" onClick={() => setActiveCat(null)}>← All Categories</button>

      <div className="vote-hero">
        <p className="vote-cat-label">Category</p>
        <h1 className="vote-hero-title">{currentCat?.name}</h1>
        <p className="vote-hero-sub">
          {savedId
            ? hasUnsavedChange
              ? 'New selection — save to update your vote'
              : 'Vote saved — tap another nominee to change'
            : activeId
              ? 'Selected — save your vote or keep browsing'
              : 'Tap a nominee to select them'}
        </p>
      </div>

      {catContestants.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">◎</span>
          <p>No nominees added for this category yet.</p>
        </div>
      ) : (
        <div className="vote-grid">
          {catContestants.map((c, i) => {
            const isActive = activeId === c.id
            const isSaved = savedId === c.id && !hasUnsavedChange
            return (
              <button
                key={c.id}
                className={`vote-card ${isSaved ? 'voted' : ''} ${isActive && !isSaved ? 'selected' : ''} ${activeId && activeId !== c.id && !isSaved ? 'dimmed' : ''}`}
                onClick={() => handleSelect(c.id)}
                aria-label={`Select ${c.name}`}
              >
                {c.image_url
                  ? <div className="vote-photo-wrap">
                      <img src={c.image_url} alt={c.name} className="vote-photo" />
                      {isActive && <div className="vote-photo-overlay">{isSaved ? '✓' : '●'}</div>}
                    </div>
                  : <div className="vote-avatar">{c.name.charAt(0).toUpperCase()}</div>
                }
                <span className="vote-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="vote-name">{c.name}</span>
                {isActive && !isSaved && <span className="vote-selected-label">Selected</span>}
                {isSaved && <span className="vote-selected-label">Your vote</span>}
              </button>
            )
          })}
        </div>
      )}

      {activeId && (
        <div className="cat-action-row">
          <button
            className="btn-review"
            onClick={handleSaveThis}
            disabled={submitting || !hasUnsavedChange && !!savedId}
          >
            {submitting
              ? <span className="btn-spinner" />
              : hasUnsavedChange
                ? `Save Vote for ${contestants.find(c => c.id === activeId)?.name}`
                : '✓ Vote Saved'}
          </button>
          {hasUnsavedChange && (
            <button className="btn-clear-selection" onClick={() => {
              setPending(prev => { const n = { ...prev }; delete n[activeCat]; return n })
            }}>
              Revert to saved
            </button>
          )}
        </div>
      )}
    </div>
  )
}
