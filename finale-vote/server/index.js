require('dotenv').config()
const express = require('express')
const { Resend } = require('resend')
const cors = require('cors')
const crypto = require('crypto')

const app = express()
app.use(express.json())

const allowedOrigins = (process.env.CLIENT_ORIGIN || '*').split(',').map(o => o.trim())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, origin || '*')
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}))

const resend = new Resend(process.env.RESEND_API_KEY)

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const otpStore = new Map()
const OTP_EXPIRY_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

function generateOtp() {
  return String(crypto.randomInt(100000, 999999))
}

async function supabaseAdmin(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${SUPABASE_URL}${path}`, opts)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { _raw: text } }
  return { ok: res.ok, status: res.status, data }
}

// POST /api/send-otp
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required.' })

  const otp = generateOtp()
  otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + OTP_EXPIRY_MS, attempts: 0 })

  try {
    const { error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM || 'Finale Elections'} <onboarding@resend.dev>`,
      to: email,
      subject: 'Your voting verification code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;color:#fff;border-radius:12px;">
          <h2 style="margin:0 0 8px;font-size:20px;">Finale Elections ✦</h2>
          <p style="color:#aaa;font-size:13px;margin:0 0 32px;">Voting Verification</p>
          <p style="font-size:15px;margin:0 0 16px;">Your verification code is:</p>
          <div style="font-size:40px;font-weight:800;letter-spacing:0.2em;padding:20px;background:#1a1a1a;border-radius:10px;text-align:center;">${otp}</div>
          <p style="color:#888;font-size:12px;margin:24px 0 0;">Expires in 10 minutes. Do not share this code.</p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return res.status(500).json({ error: 'Failed to send email. Try again.' })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Mail error:', err.message)
    res.status(500).json({ error: 'Failed to send email. Try again.' })
  }
})

// POST /api/verify-otp
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body
  if (!email || !otp) return res.status(400).json({ error: 'Email and code are required.' })

  const key = email.toLowerCase()
  const record = otpStore.get(key)

  if (!record) return res.status(400).json({ error: 'No code found. Request a new one.' })
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key)
    return res.status(400).json({ error: 'Code has expired. Request a new one.' })
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key)
    return res.status(400).json({ error: 'Too many attempts. Request a new code.' })
  }
  record.attempts++
  if (record.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Incorrect code. Try again.' })
  }
  otpStore.delete(key)

  try {
    let userId
    const create = await supabaseAdmin('/auth/v1/admin/users', 'POST', {
      email: key,
      email_confirm: true,
      password: crypto.randomBytes(32).toString('hex'),
    })

    if (create.ok && create.data.id) {
      userId = create.data.id
    } else {
      const list = await supabaseAdmin('/auth/v1/admin/users?page=1&per_page=1000')
      if (!list.ok) {
        console.error('List users failed:', list.data)
        return res.status(500).json({ error: 'Failed to find account.' })
      }
      const found = (list.data.users || []).find(u => u.email === key)
      if (!found) {
        console.error('User not found after create attempt:', create.data)
        return res.status(500).json({ error: 'Failed to create account.' })
      }
      userId = found.id
    }

    const link = await supabaseAdmin('/auth/v1/admin/generate_link', 'POST', {
      type: 'magiclink',
      email: key,
    })

    if (!link.ok || !link.data.action_link) {
      console.error('Generate link failed:', link.data)
      return res.status(500).json({ error: 'Failed to create session.' })
    }

    const url = new URL(link.data.action_link)
    const hashParams = new URLSearchParams(url.hash.replace('#', ''))
    const queryParams = url.searchParams
    const token = hashParams.get('token_hash') || queryParams.get('token') || hashParams.get('access_token')
    const type = hashParams.get('type') || queryParams.get('type') || 'magiclink'

    res.json({ success: true, token, type, email: key, action_link: link.data.action_link })
  } catch (err) {
    console.error('Auth error:', err.message)
    res.status(500).json({ error: 'Authentication failed. Try again.' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`OTP server running on port ${PORT}`))
