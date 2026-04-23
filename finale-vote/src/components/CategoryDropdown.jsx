import { useState, useRef, useEffect } from 'react'

export default function CategoryDropdown({ categories, value, onChange, allLabel = 'All Categories' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = value === 'all' ? allLabel : categories.find(c => c.id === value)?.name

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="cat-dropdown" ref={ref}>
      <button className="cat-dropdown-trigger" onClick={() => setOpen(v => !v)}>
        <span className="cat-dropdown-value">{current}</span>
        <svg className={`cat-dropdown-arrow ${open ? 'open' : ''}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="cat-dropdown-menu">
          <div
            className={`cat-dropdown-item ${value === 'all' ? 'active' : ''}`}
            onClick={() => { onChange('all'); setOpen(false) }}
          >
            {allLabel}
          </div>
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`cat-dropdown-item ${value === cat.id ? 'active' : ''}`}
              onClick={() => { onChange(cat.id); setOpen(false) }}
            >
              {cat.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
