import './VotingPanel.css'

// Step 1 — The Ballot
// User browses categories and selects nominees. Selections are stored in `pending`.
export default function BallotScreen({
  categories, contestants,
  pending, setPending,
  votes, votedForInCategory,
  activeCat, setActiveCat,
  onReview
}) {
  const totalCats = categories.length
  const savedCount = categories.filter(c => votedForInCategory(c.id)).length

  // Count selections that are new or changed vs what's saved
  const selectionCount = categories.filter(cat => {
    const sel = pending[cat.id]
    return sel && sel !== votedForInCategory(cat.id)
  }).length + categories.filter(cat => {
    return !pending[cat.id] && votedForInCategory(cat.id)
  }).length

  // ── Contestant grid for a specific category ──
  if (activeCat) {
    const currentCat = categories.find(c => c.id === activeCat)
    const catContestants = contestants.filter(c => c.category_id === activeCat)
    const savedId = votedForInCategory(activeCat)
    const pendingId = pending[activeCat]
    const activeId = pendingId !== undefined ? pendingId : savedId

    const handleSelect = (id) => {
      setPending(prev => ({ ...prev, [activeCat]: id }))
    }

    return (
      <>
        <button className="back-btn" onClick={() => setActiveCat(null)}>← All Categories</button>

        <div className="vote-hero">
          <p className="vote-cat-label">Category</p>
          <h1 className="vote-hero-title">{currentCat?.name}</h1>
          <p className="vote-hero-sub">
            {activeId
              ? 'Selection made — go back to continue or review all'
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
              const isSavedOnly = savedId === c.id && pendingId === undefined
              return (
                <button
                  key={c.id}
                  className={`vote-card ${isSavedOnly ? 'voted' : ''} ${isActive && !isSavedOnly ? 'selected' : ''} ${activeId && activeId !== c.id && !isSavedOnly ? 'dimmed' : ''}`}
                  onClick={() => handleSelect(c.id)}
                  aria-label={`Select ${c.name}`}
                >
                  {c.image_url
                    ? <div className="vote-photo-wrap">
                        <img src={c.image_url} alt={c.name} className="vote-photo" />
                        {isActive && <div className="vote-photo-overlay">{isSavedOnly ? '✓' : '●'}</div>}
                      </div>
                    : <div className="vote-avatar">{c.name.charAt(0).toUpperCase()}</div>
                  }
                  <span className="vote-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="vote-name">{c.name}</span>
                  {isActive && !isSavedOnly && <span className="vote-selected-label">Selected</span>}
                  {isSavedOnly && <span className="vote-selected-label">Your vote</span>}
                </button>
              )
            })}
          </div>
        )}

        {activeId && (
          <button className="btn-review" onClick={() => setActiveCat(null)}>
            Back to all categories
          </button>
        )}
      </>
    )
  }

  // ── Category grid ──
  const allSelections = { ...votes, ...pending }

  return (
    <>
      <div className="vote-hero">
        <h1 className="vote-hero-title">Cast Your Votes</h1>
        <p className="vote-hero-sub">
          Class of 2026 — Double Cohort · {savedCount} of {totalCats} submitted
        </p>
        {totalCats > 0 && (
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill"
              style={{ width: `${(Object.keys(allSelections).filter(id => allSelections[id]).length / totalCats) * 100}%` }} />
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
            const displayId = pendingId !== undefined ? pendingId : savedId
            const displayFor = contestants.find(c => c.id === displayId)
            const isSubmitted = !!savedId && pendingId === undefined
            const isPending = !!pendingId
            const count = contestants.filter(c => c.category_id === cat.id).length
            return (
              <button
                key={cat.id}
                className={`cat-vote-card glass-card ${isSubmitted ? 'cat-voted' : ''} ${isPending ? 'cat-pending' : ''}`}
                onClick={() => setActiveCat(cat.id)}
              >
                <div className="cat-vote-top">
                  <span className="cat-vote-num">{String(i + 1).padStart(2, '0')}</span>
                  {isSubmitted && <span className="cat-voted-check">✓</span>}
                  {isPending && <span className="cat-pending-dot" />}
                </div>
                <span className="cat-vote-name">{cat.name}</span>
                {displayFor ? (
                  <span className="cat-voted-for">
                    {isSubmitted ? '✓ ' : '● '}{displayFor.name}
                  </span>
                ) : (
                  <span className="cat-vote-count">{count} nominee{count !== 1 ? 's' : ''}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Review button — shows when there are any selections */}
      {Object.keys(allSelections).some(id => allSelections[id]) && (
        <button className="btn-review" onClick={onReview}>
          Review My Selections
        </button>
      )}
    </>
  )
}
