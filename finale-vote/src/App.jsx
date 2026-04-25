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
import './App.css'

function Inner() {
  const { theme, toggle } = useTheme()
  const [view, setView] = useState('vote')
  const [adminTab, setAdminTab] = useState('manage')

  const { user, authLoading, signInAdmin, signOut, signIn, signUp } = useAuth()
  const { categories, loading: catLoading, addCategory, removeCategory, reorderCategories } = useCategories()
  const { contestants, loading: conLoading, addContestant, removeContestant, resetVotes, updateContestantPhoto } = useContestants()
  const { votes, voteLog, saveVote, saveAllVotes, deleteVote, hasVotedInCategory, votedForInCategory } = useVoting(user?.email)
  const { votingOpen, resultsVisible, statusLoading, setVotingOpen, setResultsVisible } = useVotingStatus()

  const isAdmin = user?.isAdmin === true
  const isSuperAdmin = user?.role === 'super'
  const loading = catLoading || conLoading || statusLoading
  const totalVotes = contestants.reduce((a, c) => a + (c.votes || 0), 0)

  // Auto-set view to admin for admin users
  const effectiveView = isAdmin && view === 'vote' ? 'admin' : view

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
        <AuthGate onSignIn={signIn} onSignUp={signUp} onSignInAdmin={signInAdmin} />
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-row">
              <span>© {new Date().getFullYear()} Finale Electoral Committee</span>
              <span className="footer-sep">·</span>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="app">

      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <div className="logo-text-wrap">
              <span className="logo-title">Class of 2026</span>
              <span className="logo-sub">Double Cohort Voting System</span>
            </div>
          </div>

          <div className={`status-pill ${votingOpen ? 'open' : 'closed'}`}>
            <span className="status-dot" />
            {votingOpen ? 'Voting Open' : 'Voting Closed'}
          </div>

          <nav className="nav">
            {!isAdmin && (
              <button className={`nav-btn ${effectiveView === 'vote' ? 'active' : ''}`} onClick={() => setView('vote')}>Vote</button>
            )}
            <button className={`nav-btn ${effectiveView === 'results' ? 'active' : ''}`} onClick={() => setView('results')}>Results</button>
            {isAdmin && (
              <button className={`nav-btn ${effectiveView === 'admin' ? 'active' : ''}`} onClick={() => setView('admin')}>⚙ Admin</button>
            )}
          </nav>

          <div className="user-menu">
            <span className="user-email">
              {isAdmin ? (user.name || user.email?.split('@')[0]) : user.email?.split('@')[0]}
            </span>
            {isAdmin && <span className="admin-badge">{isSuperAdmin ? 'Super Admin' : 'Viewer'}</span>}
            <button className="sign-out-btn" onClick={signOut} title="Sign out">
              Sign out
            </button>
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
            {effectiveView === 'vote' && !isAdmin && (
              <VotingPanel
                categories={categories}
                contestants={contestants}
                votingOpen={votingOpen}
                hasVotedInCategory={hasVotedInCategory}
                votedForInCategory={votedForInCategory}
                saveVote={saveVote}
                saveAllVotes={saveAllVotes}
                votes={votes}
              />
            )}
            {effectiveView === 'results' && (
              resultsVisible || isAdmin ? (
                <ResultsPanel
                  categories={categories}
                  contestants={contestants}
                  totalVotes={totalVotes}
                  voteLog={voteLog}
                />
              ) : (
                <div className="results-locked">
                  <div className="results-locked-inner glass-card">
                    <span className="results-locked-icon">🏆</span>
                    <h2 className="results-locked-title">Results Not Available Yet</h2>
                    <p className="results-locked-desc">
                      The results will be revealed by the Electoral Committee after voting closes.
                      Check back soon!
                    </p>
                  </div>
                </div>
              )
            )}
            {effectiveView === 'admin' && isAdmin && (
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
                    onReorderCategories={reorderCategories}
                    onAddContestant={addContestant}
                    onRemoveContestant={removeContestant}
                    onUpdateContestantPhoto={updateContestantPhoto}
                    onReset={resetVotes}
                    votingOpen={votingOpen}
                    onToggleVoting={setVotingOpen}
                    resultsVisible={resultsVisible}
                    onToggleResults={setResultsVisible}
                    isSuperAdmin={isSuperAdmin}
                  />
                )}
                {adminTab === 'analytics' && (
                  <AdminAnalytics
                    categories={categories}
                    contestants={contestants}
                    totalVotes={totalVotes}
                    voteLog={voteLog}
                    isAdmin={isAdmin}
                    isSuperAdmin={isSuperAdmin}
                    onDeleteVote={deleteVote}
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
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return <ThemeProvider><Inner /></ThemeProvider>
}
