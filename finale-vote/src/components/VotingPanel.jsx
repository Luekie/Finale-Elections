import { useState, useRef, useEffect } from 'react'
import BallotScreen from './BallotScreen'
import ReviewScreen from './ReviewScreen'
import ConfirmationScreen from './ConfirmationScreen'
import './VotingPanel.css'

export default function VotingPanel({
  categories, contestants, votingOpen,
  votedForInCategory, saveAllVotes, votes, signOut, userEmail
}) {
  const [step, setStep] = useState('ballot')
  const [activeCat, setActiveCat] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const lastSubmitRef = useRef(0)

  // Persist pending selections per user in localStorage
  const storageKey = userEmail ? `pending_votes_${userEmail}` : null

  const [pending, setPendingRaw] = useState(() => {
    if (!storageKey) return {}
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { return {} }
  })

  const setPending = (updater) => {
    setPendingRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (storageKey) {
        try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* storage full */ }
      }
      return next
    })
  }

  // Clear pending from storage when user changes
  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      setPendingRaw(saved)
    } catch {
      setPendingRaw({})
    }
  }, [storageKey])

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
    // Rate limit: prevent re-submitting within 2 seconds
    const now = Date.now()
    if (now - lastSubmitRef.current < 2000) return
    lastSubmitRef.current = now

    const toSave = {}
    categories.forEach(cat => {
      const sel = pending[cat.id]
      if (sel && sel !== votedForInCategory(cat.id)) toSave[cat.id] = sel
    })

    setSubmitting(true)
    setSubmitError(null)
    try {
      if (Object.keys(toSave).length > 0) await saveAllVotes(toSave)
      setPending({})
      if (storageKey) localStorage.removeItem(storageKey)
      setStep('confirmation')
      setSigningOut(true)
      // Lock out the user — they've voted, sign them out after a short delay
      // so they can see the confirmation screen briefly
      setTimeout(() => signOut(), 4000)
    } catch (err) {
      setSubmitError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
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
          onBack={() => { setSubmitError(null); setStep('ballot') }}
          onSubmit={handleFinalSubmit}
          submitting={submitting}
          submitError={submitError}
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
            signingOut={signingOut}
          />
        </>
      )}
    </div>
  )
}
