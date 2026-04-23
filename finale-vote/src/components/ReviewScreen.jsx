import './VotingPanel.css'

// Step 2 — The Review Screen
export default function ReviewScreen({
  categories, contestants,
  pending, votes,
  votedForInCategory,
  onBack, onSubmit,
  submitting
}) {
  const allSelections = { ...votes, ...pending }

  const reviewItems = categories
    .map(cat => {
      const chosenId = allSelections[cat.id]
      const chosen = contestants.find(c => c.id === chosenId)
      const savedId = votedForInCategory(cat.id)
      const isSubmitted = savedId === chosenId && !!savedId && pending[cat.id] === undefined
      const isNew = !savedId && !!chosenId
      const isChanged = !!savedId && !!chosenId && savedId !== chosenId
      return { cat, chosen, isSubmitted, isNew, isChanged }
    })
    .filter(r => r.chosen)

  const toSubmit = reviewItems.filter(r => r.isNew || r.isChanged)

  return (
    <>
      <button className="back-btn" onClick={onBack}>Back to Edit</button>

      <div className="vote-hero">
        <h1 className="vote-hero-title">Review Your Selections</h1>
        <p className="vote-hero-sub">
          {reviewItems.length} selection{reviewItems.length !== 1 ? 's' : ''} across {reviewItems.length} categor{reviewItems.length !== 1 ? 'ies' : 'y'}
        </p>
      </div>

      <div className="review-list">
        {reviewItems.map(({ cat, chosen, isSubmitted, isNew, isChanged }) => (
          <div key={cat.id} className={`review-row glass-card ${isSubmitted ? 'review-committed' : 'review-pending'}`}>
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
            <span className={`review-badge ${isSubmitted ? 'committed' : isNew ? 'pending' : 'change'}`}>
              {isSubmitted ? '✓ Saved' : isNew ? 'New' : 'Changed'}
            </span>
          </div>
        ))}
      </div>

      <button className="btn-submit-all" onClick={onSubmit} disabled={submitting}>
        {submitting
          ? <span className="btn-spinner" />
          : toSubmit.length > 0
            ? `Final Submit — ${toSubmit.length} Vote${toSubmit.length !== 1 ? 's' : ''}`
            : 'Confirm & Continue'}
      </button>
    </>
  )
}
