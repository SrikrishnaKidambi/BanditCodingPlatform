const router = require('express').Router()
const fs = require('fs')
const path = require('path')
const db = require('../config/db')
const internalAuth = require('../middleware/internalAuth')

const PROBLEMS_PATH = path.join(__dirname, '../../data/problems.json')

function readProblems() {
  return JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'))
}

async function readProblemsFromDatabase() {
  const [rows] = await db.query(
    `SELECT problem_id, title, topic, difficulty, tags, platform, url, estimated_solving_time
     FROM problems
     ORDER BY created_at ASC, title ASC`
  )
  return rows.map(row => ({
    problem_id: row.problem_id,
    title: row.title,
    topic: row.topic,
    difficulty: row.difficulty,
    tags: typeof row.tags === 'string' && row.tags ? JSON.parse(row.tags) : (row.tags || []),
    platform: row.platform,
    url: row.url,
    estimated_solving_time: row.estimated_solving_time,
  }))
}

async function readProblemsUnified() {
  const rows = await readProblemsFromDatabase()
  return rows
}

router.get('/problems', internalAuth, async (req, res) => {
  try {
    const problems = await readProblemsUnified()
    res.json(problems)
  } catch (err) {
    console.error('[internal] failed to return problems:', err.message)
    res.status(500).json({ error: 'Failed to fetch problems' })
  }
})

router.get('/sessions/:user_id', internalAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT session_data FROM bandit_sessions WHERE user_id = ? LIMIT 1',
      [req.params.user_id],
    )
    if (rows.length === 0)
      return res.status(404).json({ error: 'Session not found' })
    res.json({ session_data: rows[0].session_data })
  } catch (err) {
    console.error('[internal] session load failed:', err.message)
    res.status(500).json({ error: 'Failed to load session' })
  }
})

router.post('/sessions/:user_id', internalAuth, async (req, res) => {
  try {
    const sessionData = req.body.session_data
    if (!sessionData) return res.status(400).json({ error: 'session_data required' })
    await db.query(
      `INSERT INTO bandit_sessions (user_id, session_data, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE session_data = VALUES(session_data), updated_at = VALUES(updated_at)`,
      [req.params.user_id, JSON.stringify(sessionData)],
    )
    res.json({ status: 'ok' })
  } catch (err) {
    console.error('[internal] session save failed:', err.message)
    res.status(500).json({ error: 'Failed to save session' })
  }
})

router.delete('/sessions/:user_id', internalAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM bandit_sessions WHERE user_id = ?', [req.params.user_id])
    res.json({ status: 'ok' })
  } catch (err) {
    console.error('[internal] session delete failed:', err.message)
    res.status(500).json({ error: 'Failed to delete session' })
  }
})

module.exports = router
