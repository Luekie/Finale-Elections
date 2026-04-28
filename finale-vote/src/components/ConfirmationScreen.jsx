import { useEffect, useState } from 'react'
import './VotingPanel.css'

// Step 3 — Confirmation / My Votes (read-only after final submission)
export default function ConfirmationScreen({ categories, contestants, votedForInCategory, signingOut }) {
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    if (!signingOut) return
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [signingOut])

  const myVotes = categories
    .map(cat => {
      const votedId = votedForInCategory(cat.id)
      const contestant = contestants.find(c => c.id === votedId)
      return { cat, contestant }
    })
    .filter(v => v.contestant)

  return (
    <>
      <div className="confirmation-wrap">
        <div className="confirmation-icon">
          <svg viewBox="0 0 52 52" width="64" height="64">
            <circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
            <polyline points="14,27 22,35 38,18" fill="none" stroke="currentColor" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="confirmation-title">Vote Successfully Cast</h1>
        <p className="confirmation-sub">
          Your selections have been recorded below.
        </p>
        {signingOut && (
          <p className="confirmation-signout-notice">
            Signing you out in {Math.max(countdown, 0)}s — thank you for voting! 🎓
          </p>
        )}
      </div>

      {myVotes.length > 0 && (
        <div className="review-section">
          <p className="review-section-label">Your votes — {myVotes.length} categor{myVotes.length !== 1 ? 'ies' : 'y'}</p>
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
                <span className="myvote-check">✓</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
