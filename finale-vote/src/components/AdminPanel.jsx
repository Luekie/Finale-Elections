import { useState, useRef } from 'react'
import './AdminPanel.css'

export default function AdminPanel({
  categories, contestants,
  onAddCategory, onRemoveCategory, onReorderCategories,
  onAddContestant, onRemoveContestant, onUpdateContestantPhoto, onUpdateContestantName,
  onReset, votingOpen, onToggleVoting,
  resultsVisible, onToggleResults,
  isSuperAdmin
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
  const [togglingResults, setTogglingResults] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [photoLoading, setPhotoLoading] = useState({})
  const photoRefs = useRef({})
  const [editingName, setEditingName] = useState(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  const handleToggleVoting = async () => {
    setTogglingVote(true)
    try { await onToggleVoting(!votingOpen) }
    finally { setTogglingVote(false) }
  }

  const handleToggleResults = async () => {
    setTogglingResults(true)
    try { await onToggleResults(!resultsVisible) }
    finally { setTogglingResults(false) }
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

  const handlePhotoChange = async (contestantId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    setPhotoLoading(p => ({ ...p, [contestantId]: true }))
    try { await onUpdateContestantPhoto(contestantId, file) }
    catch { /* silent */ }
    finally {
      setPhotoLoading(p => ({ ...p, [contestantId]: false }))
      if (photoRefs.current[contestantId]) photoRefs.current[contestantId].value = ''
    }
  }

  const startEditName = (contestant) => {
    setEditingName(contestant.id)
    setEditNameValue(contestant.name)
  }

  const cancelEditName = () => {
    setEditingName(null)
    setEditNameValue('')
  }

  const saveEditName = async (id) => {
    const trimmed = editNameValue.trim()
    if (!trimmed || trimmed === contestants.find(c => c.id === id)?.name) {
      cancelEditName()
      return
    }
    setNameLoading(true)
    try {
      await onUpdateContestantName(id, trimmed)
      cancelEditName()
    } catch {
      /* silent */
    } finally {
      setNameLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset ALL votes across all categories? This cannot be undone.')) return
    setResetting(true)
    try { await onReset() }
    finally { setResetting(false) }
  }

  const handleDragStart = (index) => { dragItem.current = index }
  const handleDragEnter = (index) => { dragOver.current = index }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null; dragOver.current = null; return
    }
    const reordered = [...categories]
    const [moved] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, moved)
    dragItem.current = null; dragOver.current = null
    onReorderCategories(reordered)
  }

  return (
    <div className="admin">

      {/* Viewer notice */}
      {!isSuperAdmin && (
        <div className="viewer-notice glass-card">
          <div>
            <span className="viewer-notice-title">Admin Monitoring</span>

          </div>
        </div>
      )}

      {/* Voting toggle */}
      <div className={`voting-toggle-card glass-card ${votingOpen ? 'vt-open' : 'vt-closed'}`}>
        <div className="vt-info">
          <span className="vt-status-dot" />
          <div>
            <span className="vt-label">{votingOpen ? 'Voting is Open' : 'Voting is Closed'}</span>
            <span className="vt-desc">
              {votingOpen
                ? 'Contestants are visible - voters can cast their votes'
                : 'Contestants are hidden - voters see a closed screen'}
            </span>
          </div>
        </div>
        <button
          className={`vt-btn ${votingOpen ? 'vt-btn-close' : 'vt-btn-open'}`}
          onClick={handleToggleVoting}
          disabled={togglingVote || !isSuperAdmin}
          title={!isSuperAdmin ? 'Super admin access required' : ''}
        >
          {togglingVote ? '...' : votingOpen ? 'Close Voting' : 'Open Voting'}
        </button>
      </div>

      {/* Results visibility toggle */}
      <div className={`voting-toggle-card glass-card ${resultsVisible ? 'vt-open' : 'vt-closed'}`}>
        <div className="vt-info">
          <span className="vt-status-dot" />
          <div>
            <span className="vt-label">{resultsVisible ? 'Results are Visible' : 'Results are Hidden'}</span>
            <span className="vt-desc">
              {resultsVisible
                ? 'All users can view the results page'
                : 'Results are hidden - users see "not available" message'}
            </span>
          </div>
        </div>
        <button
          className={`vt-btn ${resultsVisible ? 'vt-btn-close' : 'vt-btn-open'}`}
          onClick={handleToggleResults}
          disabled={togglingResults || !isSuperAdmin}
          title={!isSuperAdmin ? 'Super admin access required' : ''}
        >
          {togglingResults ? '...' : resultsVisible ? 'Hide Results' : 'Reveal Results'}
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
            onKeyDown={e => e.key === 'Enter' && isSuperAdmin && handleAddCategory()}
            disabled={addingCat || !isSuperAdmin}
            maxLength={80}
          />
          <button className="btn-primary" onClick={handleAddCategory} disabled={addingCat || !newCatName.trim() || !isSuperAdmin}>
            {addingCat ? '...' : 'Add'}
          </button>
        </div>
        {catError && <p className="input-error">{catError}</p>}
      </div>

      {/* Categories list */}
      <div className="cat-list">
        <div className="list-header">
          <span className="list-count">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</span>
          {isSuperAdmin && (
            <button className="btn-ghost-danger" onClick={handleReset} disabled={resetting}>
              {resetting ? 'Resetting...' : 'Reset all votes'}
            </button>
          )}
        </div>

        {categories.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">◎</span>
            <p>No categories yet.</p>
          </div>
        )}

        {categories.map((cat, index) => {
          const catContestants = contestants.filter(c => c.category_id === cat.id)
          const isOpen = expandedCat === cat.id
          const busy = conLoading[cat.id]

          return (
            <div
              key={cat.id}
              className={`cat-card glass-card ${isOpen ? 'is-open' : ''}`}
              draggable={isSuperAdmin}
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
            >
              <div className="cat-header" onClick={() => setExpandedCat(isOpen ? null : cat.id)}>
                <div className="cat-header-left">
                  {isSuperAdmin && <span className="drag-handle" title="Drag to reorder">⠿</span>}
                  <svg className={`cat-chevron-icon ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-badge">{catContestants.length}</span>
                </div>
                {isSuperAdmin && (
                  <button
                    className="btn-remove"
                    onClick={e => { e.stopPropagation(); handleRemoveCategory(cat.id) }}
                    aria-label="Remove category"
                  >✕</button>
                )}
              </div>

              {isOpen && (
                <div className="cat-body">
                  {catContestants.length > 0 && (
                    <div className="con-list">
                      {catContestants.map((c, i) => (
                        <div key={c.id} className="con-row">
                          {c.image_url
                            ? <img src={c.image_url} alt={c.name} className="con-thumb" />
                            : <div className="con-avatar">{c.name.charAt(0).toUpperCase()}</div>
                          }
                          <span className="con-num">{String(i + 1).padStart(2, '0')}</span>
                          {editingName === c.id ? (
                            <input
                              className="con-name-edit"
                              value={editNameValue}
                              onChange={e => setEditNameValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEditName(c.id)
                                if (e.key === 'Escape') cancelEditName()
                              }}
                              onBlur={() => saveEditName(c.id)}
                              disabled={nameLoading}
                              autoFocus
                              maxLength={40}
                            />
                          ) : (
                            <span
                              className="con-name"
                              onClick={() => isSuperAdmin && startEditName(c)}
                              style={{ cursor: isSuperAdmin ? 'pointer' : 'default' }}
                              title={isSuperAdmin ? 'Click to edit' : ''}
                            >
                              {c.name}
                            </span>
                          )}
                          <span className="con-votes">{c.votes || 0}v</span>
                          {isSuperAdmin && (
                            <>
                              <input
                                ref={el => { photoRefs.current[c.id] = el }}
                                type="file" accept="image/*"
                                className="file-input"
                                id={`photo-${c.id}`}
                                onChange={e => handlePhotoChange(c.id, e)}
                                disabled={photoLoading[c.id]}
                              />
                              <label htmlFor={`photo-${c.id}`} className="btn-photo" title="Update photo">
                                {photoLoading[c.id] ? '...' : '📷'}
                              </label>
                              <button
                                className="btn-remove"
                                onClick={() => handleRemoveContestant(c.id, c.image_url)}
                                aria-label={`Remove ${c.name}`}
                              >✕</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isSuperAdmin && (
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
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
