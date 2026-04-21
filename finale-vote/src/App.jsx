import { useState } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { useAuth } from './hooks/useAuth'
import { useCategories } from './hooks/useCategories'
import { useContestants } from './hooks/useContestants'
import { useVoting } from './hooks/useVoting'
import { useVotingStatus } from './hooks/useVotingStatus'
import AuthGate from './components/AuthGate'
import AdminPanel from './components/AdminPanel'
import AdminAnalytics from './components/AdminAnalytics'
import VotingPanel from './components/VotingPanel'
import ResultsPanel from './components/ResultsPanel'
import AdminLogin from './components/AdminLogin'
import './App.css'

function Inner() {
  const { theme, toggle } = useTheme()
  const [view, setView] = useState('vote')
  const [adminTab, setAdminTab] = useState('manage')
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const { user, authLoading, authError, signInWithGoogle, signOut } = useAuth()
  const { categories, loading: catLoading, addCategory, removeCategory } = useCategories()
  const { contestants, loading: conLoading, addContestant, removeContestant, resetVotes } = useContestants()
  const { votes, voteLog, castVote, hasVotedInCategory, votedForInCategory } = useVoting(user?.email)
  const { votingOpen, statusLoading, setVotingOpen } = useVotingStatus()

  const loading = catLoading || conLoading || statusLoading
  const totalVotes = contestants.reduce((a, c) => a + (c.votes || 0), 0)

  // Show auth gate if not logged in
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading" style={{ minHeight: '100vh' }}>
          <span className="spinner" /><p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <AuthGate onSignInWithGoogle={signInWithGoogle} authError={authError} />
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-row">
              <span>© {new Date().getFullYear()} Finale Electoral Committee</span>
              <span className="footer-sep">·</span>
              <span>Supported by Finale Dinner Committee</span>
            </div>
            <div className="footer-row footer-dev">
              Developed by <strong>Lusekero Mwanjoka</strong>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  const handleManageClick = () => {
    if (adminUnlocked) setView('admin')
    else setShowLogin(true)
  }

  const handleLogin = (ok) => {
    if (ok) { setAdminUnlocked(true); setShowLogin(false); setView('admin') }
    else setShowLogin(false)
  }

  return (
    <div className="app">
      {showLogin && <AdminLogin onResult={handleLogin} />}

      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <div className="logo-text-wrap">
              <span className="logo-title">Class of 2026</span>
              <span className="logo-sub">Double Cohort Voting</span>
            </div>
          </div>

          <div className={`status-pill ${votingOpen ? 'open' : 'closed'}`}>
            <span className="status-dot" />
            {votingOpen ? 'Voting Open' : 'Voting Closed'}
          </div>

          <nav className="nav">
            <button className={`nav-btn ${view === 'vote' ? 'active' : ''}`} onClick={() => setView('vote')}>Vote</button>
            <button className={`nav-btn ${view === 'results' ? 'active' : ''}`} onClick={() => setView('results')}>Results</button>
            <button className={`nav-btn admin-btn ${view === 'admin' ? 'active' : ''}`} onClick={handleManageClick}>
              {adminUnlocked ? '⚙' : '🔒'}
            </button>
          </nav>

          <div className="user-menu">
            <span className="user-email">{user.email?.split('@')[0]}</span>
            <button className="sign-out-btn" onClick={signOut} title="Sign out">↩</button>
          </div>

          <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main className="main">
        {loading ? (
          <div className="loading"><span className="spinner" /><p>Loading...</p></div>
        ) : (
          <>
            {view === 'vote' && (
              <VotingPanel
                categories={categories}
                contestants={contestants}
                votingOpen={votingOpen}
                hasVotedInCategory={hasVotedInCategory}
                votedForInCategory={votedForInCategory}
                onVote={castVote}
              />
            )}
            {view === 'results' && (
              <ResultsPanel
                categories={categories}
                contestants={contestants}
                totalVotes={totalVotes}
                voteLog={voteLog}
              />
            )}
            {view === 'admin' && adminUnlocked && (
              <div className="admin-wrap">
                <div className="admin-tabs">
                  <button className={`admin-tab ${adminTab === 'manage' ? 'active' : ''}`} onClick={() => setAdminTab('manage')}>Manage</button>
                  <button className={`admin-tab ${adminTab === 'analytics' ? 'active' : ''}`} onClick={() => setAdminTab('analytics')}>Analytics</button>
                </div>
                {adminTab === 'manage' && (
                  <AdminPanel
                    categories={categories}
                    contestants={contestants}
                    onAddCategory={addCategory}
                    onRemoveCategory={removeCategory}
                    onAddContestant={addContestant}
                    onRemoveContestant={removeContestant}
                    onReset={resetVotes}
                    votingOpen={votingOpen}
                    onToggleVoting={setVotingOpen}
                  />
                )}
                {adminTab === 'analytics' && (
                  <AdminAnalytics
                    categories={categories}
                    contestants={contestants}
                    totalVotes={totalVotes}
                    voteLog={voteLog}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-row">
            <span>© {new Date().getFullYear()} Finale Electoral Committee</span>
            <span className="footer-sep">·</span>
            <span>Supported by Finale Dinner Committee</span>
          </div>
          <div className="footer-row footer-dev">
            Developed by <strong>Lusekero Mwanjoka</strong>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return <ThemeProvider><Inner /></ThemeProvider>
}
