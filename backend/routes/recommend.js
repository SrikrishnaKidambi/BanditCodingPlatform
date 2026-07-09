const router = require('express').Router()
const axios  = require('axios')
const db     = require('../config/db')
const auth   = require('../middleware/auth')

const py = () => process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

// POST /api/assess  — cold-start ratings from the frontend
router.post('/assess', auth, async (req, res) => {
  const { ratings } = req.body
  if (!ratings) return res.status(400).json({ error: 'ratings required' })
  try {
    await axios.post(`${py()}/assess`, { user_id: req.user.user_id, ratings })
    res.json({ status: 'ok' })
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: 'Assessment failed' })
  }
})

// GET /api/recommend
router.get('/recommend', auth, async (req, res) => {
  try {
    const { data } = await axios.get(`${py()}/recommend/${req.user.user_id}`)
    res.json(data)
  } catch (err) {
    if (err.response?.status === 404)
      return res.status(404).json({ error: 'No problems available' })
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: 'Recommendation failed' })
  }
})

// POST /api/submit
router.post('/submit', auth, async (req, res) => {
  const { problem_id, title, topic, difficulty, mode, solved } = req.body
  if (!problem_id || !topic || !difficulty || !mode || solved === undefined)
    return res.status(400).json({ error: 'Missing required fields' })

  try {
    await db.query(
      'INSERT INTO submissions (user_id, problem_id, title, topic, difficulty, mode, outcome) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.user_id, problem_id, title || '', topic, difficulty, mode, solved ? 'solved' : 'failed']
    )
    await axios.post(`${py()}/submit`, {
      user_id: req.user.user_id,
      topic,
      difficulty,
      solved,
    })
    res.json({ status: 'ok' })
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: 'Submit failed' })
  }
})

// GET /api/mastery
router.get('/mastery', auth, async (req, res) => {
  try {
    const { data } = await axios.get(`${py()}/mastery/${req.user.user_id}`)
    res.json(data)
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: 'Mastery fetch failed' })
  }
})

// GET /api/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const [modeRows] = await db.query(
      'SELECT mode, COUNT(*) AS count FROM submissions WHERE user_id = ? GROUP BY mode',
      [req.user.user_id]
    )
    const mode_counts = {}
    for (const row of modeRows) mode_counts[row.mode] = Number(row.count)

    // Revision count broken down by topic
    const [revRows] = await db.query(
      `SELECT topic, COUNT(*) AS count FROM submissions
       WHERE user_id = ? AND mode = 'revision' GROUP BY topic`,
      [req.user.user_id]
    )
    const revision_by_topic = {}
    for (const row of revRows) revision_by_topic[row.topic] = Number(row.count)

    const { data: pyStats } = await axios.get(`${py()}/stats/${req.user.user_id}`)

    res.json({
      mode_counts,
      revision_by_topic,
      arm_counts:      pyStats.arm_counts,
      overall_mastery: pyStats.overall_mastery,
      diversity_score: pyStats.diversity_score,
      weakest:         pyStats.weakest,
      strongest:       pyStats.strongest,
    })
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: 'Stats fetch failed' })
  }
})

// GET /api/trajectory — daily success rate for the learning trajectory chart
router.get('/trajectory', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         DATE(attempted_at)          AS day,
         SUM(outcome = 'solved')     AS solved,
         COUNT(*)                    AS total
       FROM submissions
       WHERE user_id = ?
       GROUP BY DATE(attempted_at)
       ORDER BY day ASC`,
      [req.user.user_id]
    )
    res.json(rows.map(r => ({
      day:          r.day.toISOString().split('T')[0],
      solved:       Number(r.solved),
      total:        Number(r.total),
      success_rate: Number(r.total) > 0
        ? Math.round((Number(r.solved) / Number(r.total)) * 100)
        : 0,
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Trajectory fetch failed' })
  }
})

module.exports = router
