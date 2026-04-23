import { useState } from 'react'
import BallotScreen from './BallotScreen'
import ReviewScreen from './ReviewScreen'
import ConfirmationScreen from './ConfirmationScreen'
import './VotingPanel.css'

export default function VotingPanel({
  categories, contestants, votingOpen,
  votedForInCategory, saveAllVotes, votes
}) {
  const [step, setStep] = useState('ballot') // 'ballot' | 'review' | 'confirmation'
  const [activeCat, setActiveCat] = useState(null)
  const [pending, setPending] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const savedCount = categories.filter(c => votedForInCategory(c.id)).length

  if (!votingOpen) {
    return (
      <div className="voting">
        <div className="vote-closed-wrap glass-card">
          <span className="vote-closed-icon">🔒</span>
          <h2 className="vote-closed-title">Voting is Closed</h2>
          <p className="vote-closed-sub">
            The Electoral Committee hasn't opened voting yet.<br />Please check back soon.
          </p>
        </div>
      </div>
    )
  }

  const handleFinalSubmit = async () => {
    const toSave = {}
    categories.forEach(cat => {
      const sel = pending[cat.id]
      if (sel && sel !== votedForInCategory(cat.id)) toSave[cat.id] = sel
    })

    setSubmitting(true)
    try {
      if (Object.keys(toSave).length > 0) await saveAllVotes(toSave)
      setPending({})
      setStep('confirmation')
    } catch { /* stay on review */ }
    finally { setSubmitting(false) }
  }

  // Tab bar — only show when not in a category drill-down
  const showTabs = step === 'ballot' && !activeCat

  return (
    <div className="voting">
      {/* Tab bar */}
      {showTabs && (
        <div className="vote-tabs">
          <button className="vote-tab active">Vote</button>
          {savedCount > 0 && (
            <button className="vote-tab" onClick={() => setStep('confirmation')}>
              My Votes <span className="vote-tab-badge">{savedCount}</span>
            </button>
          )}
        </div>
      )}

      {step === 'ballot' && (
        <BallotScreen
          categories={categories}
          contestants={contestants}
          pending={pending}
          setPending={setPending}
          votes={votes}
          votedForInCategory={votedForInCategory}
          activeCat={activeCat}
          setActiveCat={setActiveCat}
          onReview={() => { setActiveCat(null); setStep('review') }}
        />
      )}

      {step === 'review' && (
        <ReviewScreen
          categories={categories}
          contestants={contestants}
          pending={pending}
          votes={votes}
          votedForInCategory={votedForInCategory}
          onBack={() => setStep('ballot')}
          onSubmit={handleFinalSubmit}
          submitting={submitting}
        />
      )}

      {step === 'confirmation' && (
        <>
          {/* Tab bar on confirmation too */}
          <div className="vote-tabs">
            <button className="vote-tab" onClick={() => setStep('ballot')}>Vote</button>
            <button className="vote-tab active">
              My Votes <span className="vote-tab-badge">{savedCount}</span>
            </button>
          </div>
          <ConfirmationScreen
            categories={categories}
            contestants={contestants}
            votedForInCategory={votedForInCategory}
          />
        </>
      )}
    </div>
  )
}
