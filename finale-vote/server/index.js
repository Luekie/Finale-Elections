require('dotenv').config()
const express = require('express')
const nodemailer = require('nodemailer')
const cors = require('cors')
const crypto = require('crypto')

const app = express()
app.use(express.json())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }))

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

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
    await transporter.sendMail({
      from: `"${process.env.GMAIL_FROM || 'Finale Elections'}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your voting verification code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;color:#fff;border-radius:12px;">
          <h2 style="margin:0 0 8px;font-size:20px;">Class of 2026 ✦</h2>
          <p style="color:#aaa;font-size:13px;margin:0 0 32px;">Double Cohort Voting System</p>
          <p style="font-size:15px;margin:0 0 16px;">Your verification code is:</p>
          <div style="font-size:40px;font-weight:800;letter-spacing:0.2em;padding:20px;background:#1a1a1a;border-radius:10px;text-align:center;">${otp}</div>
          <p style="color:#888;font-size:12px;margin:24px 0 0;">Expires in 10 minutes. Do not share this code.</p>
        </div>
      `,
    })
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
    // Step 1: Create user (or get existing)
    let userId
    const create = await supabaseAdmin('/auth/v1/admin/users', 'POST', {
      email: key,
      email_confirm: true,
      password: crypto.randomBytes(32).toString('hex'),
    })

    if (create.ok && create.data.id) {
      userId = create.data.id
    } else {
      // User likely already exists — list and find
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

    // Step 2: Generate magic link using the correct endpoint
    const link = await supabaseAdmin('/auth/v1/admin/generate_link', 'POST', {
      type: 'magiclink',
      email: key,
    })

    console.log('Generate link response:', JSON.stringify(link.data))

    if (!link.ok || !link.data.action_link) {
      console.error('Generate link failed:', link.data)
      return res.status(500).json({ error: 'Failed to create session.' })
    }

    // Extract hashed_token from the action_link URL fragment
    const url = new URL(link.data.action_link)
    // action_link format: https://.../#access_token=...&token_hash=...&type=magiclink
    // OR query params depending on Supabase version
    const hashParams = new URLSearchParams(url.hash.replace('#', ''))
    const queryParams = url.searchParams

    const token = hashParams.get('token_hash') || queryParams.get('token') || hashParams.get('access_token')
    const type = hashParams.get('type') || queryParams.get('type') || 'magiclink'

    console.log('token:', token, 'type:', type)
    res.json({ success: true, token, type, email: key, action_link: link.data.action_link })
  } catch (err) {
    console.error('Auth error:', err.message)
    res.status(500).json({ error: 'Authentication failed. Try again.' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`OTP server running on port ${PORT}`))
