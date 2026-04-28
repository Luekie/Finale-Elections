// Generates a stable device fingerprint from browser characteristics.
// Not 100% foolproof (private mode, different browsers bypass it) but
// a meaningful barrier against casual multi-account creation.

export async function getDeviceFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency,
    navigator.deviceMemory ?? '',
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.platform ?? '',
  ]

  // Canvas fingerprint — renders text and reads pixel data
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Finale2026🎓', 2, 15)
    components.push(canvas.toDataURL())
  } catch { /* canvas blocked in some browsers */ }

  const raw = components.join('|')
  const encoded = new TextEncoder().encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
