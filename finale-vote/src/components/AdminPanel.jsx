import { useState, useRef } from 'react'
import './AdminPanel.css'

export default function AdminPanel({
  categories, contestants,
  onAddCategory, onRemoveCategory,
  onAddContestant, onRemoveContestant,
  onReset, votingOpen, onToggleVoting
}) {
  const [expandedCat, setExpandedCat] = useState(null)
  const [newCatName, setNewCatName] = useState('')
  const [catError, setCatError] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [conName, setConName] = useState({})
  const [conImage, setConImage] = useState({})
  const [conPreview, setConPreview] = useState({})
  const [conError, setConError] = useState({})
  const [conLoading, setConLoading] = useState({})
  const fileRefs = useRef({})
  const [togglingVote, setTogglingVote] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleToggleVoting = async () => {
    setTogglingVote(true)
    try { await onToggleVoting(!votingOpen) }
    finally { setTogglingVote(false) }
  }

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim()
    if (!trimmed) { setCatError('Enter a category name'); return }
    if (categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setCatError('Category already exists'); return
    }
    setAddingCat(true)
    try { await onAddCategory(trimmed); setNewCatName(''); setCatError('') }
    catch { setCatError('Failed to add category') }
    finally { setAddingCat(false) }
  }

  const handleRemoveCategory = async (id) => {
    const count = contestants.filter(c => c.category_id === id).length
    if (!confirm(`Remove this category and its ${count} contestant(s)?`)) return
    await onRemoveCategory(id)
    if (expandedCat === id) setExpandedCat(null)
  }

  const handleImageChange = (catId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setConError(p => ({ ...p, [catId]: 'Select an image file' })); return
    }
    if (file.size > 5 * 1024 * 1024) {
      setConError(p => ({ ...p, [catId]: 'Image must be under 5MB' })); return
    }
    setConImage(p => ({ ...p, [catId]: file }))
    setConPreview(p => ({ ...p, [catId]: URL.createObjectURL(file) }))
    setConError(p => ({ ...p, [catId]: '' }))
  }

  const clearImage = (catId) => {
    setConImage(p => ({ ...p, [catId]: null }))
    setConPreview(p => ({ ...p, [catId]: null }))
    if (fileRefs.current[catId]) fileRefs.current[catId].value = ''
  }

  const handleAddContestant = async (catId) => {
    const trimmed = (conName[catId] || '').trim()
    if (!trimmed) { setConError(p => ({ ...p, [catId]: 'Enter a name' })); return }
    const catContestants = contestants.filter(c => c.category_id === catId)
    if (catContestants.find(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setConError(p => ({ ...p, [catId]: 'Name already exists in this category' })); return
    }
    setConLoading(p => ({ ...p, [catId]: true }))
    try {
      await onAddContestant(catId, trimmed, conImage[catId] || null)
      setConName(p => ({ ...p, [catId]: '' }))
      clearImage(catId)
      setConError(p => ({ ...p, [catId]: '' }))
    } catch {
      setConError(p => ({ ...p, [catId]: 'Failed to add contestant' }))
    } finally {
      setConLoading(p => ({ ...p, [catId]: false }))
    }
  }

  const handleRemoveContestant = async (id, imageUrl) => {
    if (!confirm('Remove this contestant?')) return
    await onRemoveContestant(id, imageUrl)
  }

  const handleReset = async () => {
    if (!confirm('Reset ALL votes across all categories? This cannot be undone.')) return
    setResetting(true)
    try { await onReset() }
    finally { setResetting(false) }
  }

  return (
    <div className="admin">

      {/* Voting toggle */}
      <div className={`voting-toggle-card glass-card ${votingOpen ? 'vt-open' : 'vt-closed'}`}>
        <div className="vt-info">
          <span className="vt-status-dot" />
          <div>
            <span className="vt-label">{votingOpen ? 'Voting is Open' : 'Voting is Closed'}</span>
            <span className="vt-desc">
              {votingOpen
                ? 'Contestants are visible — voters can cast their votes'
                : 'Contestants are hidden — voters see a closed screen'}
            </span>
          </div>
        </div>
        <button
          className={`vt-btn ${votingOpen ? 'vt-btn-close' : 'vt-btn-open'}`}
          onClick={handleToggleVoting}
          disabled={togglingVote}
        >
          {togglingVote ? '...' : votingOpen ? 'Close Voting' : 'Open Voting'}
        </button>
      </div>

      {/* Add category */}
      <div className="section-block glass-card">
        <h2 className="block-title">Add Category</h2>
        <div className="input-row">
          <input
            className="text-input"
            placeholder="e.g. G.O.A.T OF OUR TIME"
            value={newCatName}
            onChange={e => { setNewCatName(e.target.value); setCatError('') }}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            disabled={addingCat}
            maxLength={80}
          />
          <button className="btn-primary" onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()}>
            {addingCat ? '...' : 'Add'}
          </button>
        </div>
        {catError && <p className="input-error">{catError}</p>}
      </div>

      {/* Categories list */}
      <div className="cat-list">
        <div className="list-header">
          <span className="list-count">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</span>
          <button className="btn-ghost-danger" onClick={handleReset} disabled={resetting}>
            {resetting ? 'Resetting...' : 'Reset all votes'}
          </button>
        </div>

        {categories.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">◎</span>
            <p>No categories yet. The 28 award categories were pre-seeded — run the SQL migration if you haven't.</p>
          </div>
        )}

        {categories.map((cat) => {
          const catContestants = contestants.filter(c => c.category_id === cat.id)
          const isOpen = expandedCat === cat.id
          const busy = conLoading[cat.id]

          return (
            <div key={cat.id} className="cat-card glass-card">
              {/* Category header */}
              <div className="cat-header" onClick={() => setExpandedCat(isOpen ? null : cat.id)}>
                <div className="cat-header-left">
                  <span className="cat-chevron">{isOpen ? '▾' : '▸'}</span>
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-badge">{catContestants.length}</span>
                </div>
                <button
                  className="btn-remove"
                  onClick={e => { e.stopPropagation(); handleRemoveCategory(cat.id) }}
                  aria-label="Remove category"
                >✕</button>
              </div>

              {/* Expanded: contestants + add form */}
              {isOpen && (
                <div className="cat-body">
                  {/* Existing contestants */}
                  {catContestants.length > 0 && (
                    <div className="con-list">
                      {catContestants.map((c, i) => (
                        <div key={c.id} className="con-row">
                          {c.image_url
                            ? <img src={c.image_url} alt={c.name} className="con-thumb" />
                            : <div className="con-avatar">{c.name.charAt(0).toUpperCase()}</div>
                          }
                          <span className="con-num">{String(i + 1).padStart(2, '0')}</span>
                          <span className="con-name">{c.name}</span>
                          <span className="con-votes">{c.votes || 0}v</span>
                          <button
                            className="btn-remove"
                            onClick={() => handleRemoveContestant(c.id, c.image_url)}
                            aria-label={`Remove ${c.name}`}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add contestant form */}
                  <div className="con-add-form">
                    <div className="input-row">
                      <input
                        className="text-input"
                        placeholder="Contestant name..."
                        value={conName[cat.id] || ''}
                        onChange={e => { setConName(p => ({ ...p, [cat.id]: e.target.value })); setConError(p => ({ ...p, [cat.id]: '' })) }}
                        onKeyDown={e => e.key === 'Enter' && handleAddContestant(cat.id)}
                        disabled={busy}
                        maxLength={40}
                      />
                    </div>

                    <div className="image-upload">
                      <input
                        ref={el => { fileRefs.current[cat.id] = el }}
                        type="file" accept="image/*"
                        onChange={e => handleImageChange(cat.id, e)}
                        className="file-input"
                        id={`img-${cat.id}`}
                        disabled={busy}
                      />
                      <label htmlFor={`img-${cat.id}`} className="file-label">
                        {conPreview[cat.id] ? (
                          <div className="preview-wrap">
                            <img src={conPreview[cat.id]} alt="Preview" className="preview-img" />
                            <button type="button" className="preview-remove"
                              onClick={e => { e.preventDefault(); clearImage(cat.id) }}>✕</button>
                          </div>
                        ) : (
                          <div className="file-placeholder">
                            <span className="file-icon">📷</span>
                            <span className="file-text">Add photo (optional)</span>
                          </div>
                        )}
                      </label>
                    </div>

                    {conError[cat.id] && <p className="input-error">{conError[cat.id]}</p>}

                    <button
                      className="btn-primary add-btn"
                      onClick={() => handleAddContestant(cat.id)}
                      disabled={busy || !(conName[cat.id] || '').trim()}
                    >
                      {busy ? 'Adding...' : 'Add Contestant'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
