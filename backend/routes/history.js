const router = require('express').Router()
const db     = require('../config/db')
const auth   = require('../middleware/auth')

// GET /api/history
router.get('/history', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT problem_id, title, topic, difficulty, mode, outcome, attempted_at
       FROM submissions WHERE user_id = ? ORDER BY attempted_at DESC LIMIT 100`,
      [req.user.user_id]
    )
    res.json(rows.map(r => ({
      problem_id: r.problem_id,
      title:      r.title,
      topic:      r.topic,
      difficulty: r.difficulty,
      mode:       r.mode,
      outcome:    r.outcome,
      date:       r.attempted_at.toISOString().split('T')[0],
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'History fetch failed' })
  }
})

// GET /api/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const [userRows] = await db.query(
      'SELECT * FROM users WHERE user_id = ?',
      [req.user.user_id]
    )
    if (userRows.length === 0)
      return res.status(404).json({ error: 'User not found' })

    const u = userRows[0]

    const [statsRows] = await db.query(
      `SELECT
         COUNT(*) AS total_attempted,
         SUM(outcome = 'solved') AS total_solved,
         COUNT(DISTINCT topic) AS topics_active
       FROM submissions WHERE user_id = ?`,
      [req.user.user_id]
    )
    const s = statsRows[0]

    // Streak: consecutive calendar days with at least one submission
    const [dayRows] = await db.query(
      `SELECT DATE(attempted_at) AS day FROM submissions
       WHERE user_id = ? GROUP BY DATE(attempted_at) ORDER BY day DESC`,
      [req.user.user_id]
    )
    let streak = 0
    const today = new Date(); today.setHours(0, 0, 0, 0)
    for (let i = 0; i < dayRows.length; i++) {
      const diff = Math.round((today - new Date(dayRows[i].day)) / 86400000)
      if (diff === i || (i === 0 && diff === 1)) streak++
      else break
    }

    res.json({
      user_id:        u.user_id,
      name:           u.display_name,
      email:          u.email,
      joinDate:       u.created_at.toISOString().split('T')[0],
      totalAttempted: Number(s.total_attempted) || 0,
      totalSolved:    Number(s.total_solved)    || 0,
      topicsActive:   Number(s.topics_active)   || 0,
      streak,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Profile fetch failed' })
  }
})

module.exports = router
