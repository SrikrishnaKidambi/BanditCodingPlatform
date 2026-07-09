const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const db      = require('../config/db')

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, display_name } = req.body
  if (!email || !password || !display_name)
    return res.status(400).json({ error: 'email, password, and display_name are required' })

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0)
      return res.status(409).json({ error: 'Email already registered' })

    const user_id       = uuidv4()
    const password_hash = await bcrypt.hash(password, 10)

    await db.query(
      'INSERT INTO users (user_id, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
      [user_id, email, password_hash, display_name]
    )

    const user  = { user_id, email, display_name }
    const token = sign(user)
    res.status(201).json({ token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' })

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email])
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials' })

    const row   = rows[0]
    const valid = await bcrypt.compare(password, row.password_hash)
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' })

    await db.query('UPDATE users SET last_active = NOW() WHERE user_id = ?', [row.user_id])

    const user  = { user_id: row.user_id, email: row.email, display_name: row.display_name }
    const token = sign(user)
    res.json({ token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
