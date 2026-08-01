const router    = require('express').Router()
const bcrypt    = require('bcryptjs')
const jwt       = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const fs        = require('fs')
const path      = require('path')
const axios     = require('axios')
const db        = require('../config/db')
const adminAuth = require('../middleware/adminAuth')

const PROBLEMS_PATH = path.join(__dirname, '../../data/problems.json')
const TOPICS_PATH   = path.join(__dirname, '../../data/topics.json')

const TOPIC_PREFIX = {
  Arrays: 'ARR', BinarySearch: 'BS', Trees: 'TR', Graphs: 'GR', DP: 'DP',
}
const DIFF_PREFIX = { Easy: 'E', Medium: 'M', Hard: 'H' }

const py = () => process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

// Ensure required tables exist on startup
;(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        admin_id      VARCHAR(36)  NOT NULL UNIQUE,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.query(`
      CREATE TABLE IF NOT EXISTS problems (
        problem_id            VARCHAR(50)  NOT NULL PRIMARY KEY,
        title                 VARCHAR(255) NOT NULL,
        topic                 VARCHAR(50)  NOT NULL,
        difficulty            VARCHAR(20)  NOT NULL,
        tags                  JSON NULL,
        platform              VARCHAR(100) NOT NULL,
        url                   TEXT NULL,
        estimated_solving_time INT NOT NULL DEFAULT 20,
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_topic_difficulty (topic, difficulty),
        INDEX idx_difficulty (difficulty)
      )
    `)
  } catch (err) {
    console.error('[admin] Failed to initialize admin tables:', err.message)
  }
})()

function readProblems() {
  return JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'))
}
function writeProblems(problems) {
  fs.writeFileSync(PROBLEMS_PATH, JSON.stringify(problems, null, 2))
}
function readTopics() {
  if (!fs.existsSync(TOPICS_PATH))
    return { topics: ['Arrays', 'BinarySearch', 'Trees', 'Graphs', 'DP'] }
  return JSON.parse(fs.readFileSync(TOPICS_PATH, 'utf8'))
}
function writeTopics(data) {
  fs.writeFileSync(TOPICS_PATH, JSON.stringify(data, null, 2))
}

function generateId(topic, difficulty, existing) {
  const tp  = TOPIC_PREFIX[topic] || topic.slice(0, 3).toUpperCase()
  const dp  = DIFF_PREFIX[difficulty] || difficulty[0].toUpperCase()
  const pfx = `${tp}-${dp}-`
  const nums = existing
    .filter(p => p.problem_id.startsWith(pfx))
    .map(p => parseInt(p.problem_id.replace(pfx, ''), 10) || 0)
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${pfx}${String(next).padStart(3, '0')}`
}

function normaliseProblem(q, existingForId) {
  return {
    problem_id: q.problem_id || generateId(q.topic, q.difficulty, existingForId),
    title:      String(q.title).trim(),
    topic:      String(q.topic).trim(),
    difficulty: String(q.difficulty).trim(),
    tags:       Array.isArray(q.tags)
                  ? q.tags
                  : String(q.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    platform:   String(q.platform).trim(),
    url:        String(q.url).trim(),
    estimated_solving_time: Number(q.estimated_solving_time) || 20,
  }
}

function signAdmin(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function normaliseDbProblem(problem) {
  const tags = Array.isArray(problem.tags)
    ? problem.tags
    : String(problem.tags || '').split(',').map(t => t.trim()).filter(Boolean)

  return {
    problem_id: problem.problem_id || problem.id,
    title: String(problem.title || '').trim(),
    topic: String(problem.topic || '').trim(),
    difficulty: String(problem.difficulty || '').trim(),
    tags,
    platform: String(problem.platform || '').trim(),
    url: String(problem.url || '').trim(),
    estimated_solving_time: Number(problem.estimated_solving_time) || 20,
  }
}

async function readProblemsFromDatabase() {
  const [rows] = await db.query(`
    SELECT problem_id, title, topic, difficulty, tags, platform, url, estimated_solving_time
    FROM problems
    ORDER BY created_at ASC, title ASC
  `)

  return rows.map(row => ({
    ...normaliseDbProblem(row),
    tags: typeof row.tags === 'string' && row.tags
      ? JSON.parse(row.tags)
      : (row.tags || []),
  }))
}

async function writeProblemToDatabase(problem) {
  await db.query(
    `INSERT INTO problems (
      problem_id, title, topic, difficulty, tags, platform, url, estimated_solving_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      topic = VALUES(topic),
      difficulty = VALUES(difficulty),
      tags = VALUES(tags),
      platform = VALUES(platform),
      url = VALUES(url),
      estimated_solving_time = VALUES(estimated_solving_time)`,
    [
      problem.problem_id,
      problem.title,
      problem.topic,
      problem.difficulty,
      JSON.stringify(problem.tags || []),
      problem.platform,
      problem.url,
      problem.estimated_solving_time,
    ]
  )
}

async function deleteProblemFromDatabase(problem_id) {
  await db.query('DELETE FROM problems WHERE problem_id = ?', [problem_id])
}

async function persistProblemsToDatabase(problems) {
  for (const problem of problems) {
    try {
      await writeProblemToDatabase(problem)
    } catch (err) {
      console.warn(`[admin] Failed to persist problem ${problem.problem_id} to DB:`, err.message)
    }
  }
}

async function readProblemsUnified() {
  try {
    const rows = await readProblemsFromDatabase()
    if (rows.length > 0) return rows
  } catch (err) {
    console.warn('[admin] Falling back to JSON problems file:', err.message)
  }
  return readProblems()
}

async function persistProblems(problems) {
  try {
    await persistProblemsToDatabase(problems)
  } catch (err) {
    console.warn('[admin] Failed to persist problems to DB:', err.message)
  }
  writeProblems(problems)
}

async function syncProblemsToDatabase() {
  const problems = readProblems()
  const normalized = problems.map(p => normaliseProblem(p, problems))

  for (const problem of normalized) {
    await db.query(
      `INSERT INTO problems (
        problem_id, title, topic, difficulty, tags, platform, url, estimated_solving_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        topic = VALUES(topic),
        difficulty = VALUES(difficulty),
        tags = VALUES(tags),
        platform = VALUES(platform),
        url = VALUES(url),
        estimated_solving_time = VALUES(estimated_solving_time)`,
      [
        problem.problem_id,
        problem.title,
        problem.topic,
        problem.difficulty,
        JSON.stringify(problem.tags),
        problem.platform,
        problem.url,
        problem.estimated_solving_time,
      ]
    )
  }

  return normalized.length
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

router.post('/auth/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' })
  try {
    const [existing] = await db.query('SELECT id FROM admins WHERE email = ?', [email])
    if (existing.length > 0)
      return res.status(409).json({ error: 'Admin already registered' })
    const admin_id      = uuidv4()
    const password_hash = await bcrypt.hash(password, 10)
    await db.query(
      'INSERT INTO admins (admin_id, email, password_hash) VALUES (?, ?, ?)',
      [admin_id, email, password_hash]
    )
    const token = signAdmin({ admin_id, email, role: 'admin' })
    res.status(201).json({ token, admin: { admin_id, email } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' })
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email])
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, rows[0].password_hash)
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' })
    const { admin_id, email: adminEmail } = rows[0]
    const token = signAdmin({ admin_id, email: adminEmail, role: 'admin' })
    res.json({ token, admin: { admin_id, email: adminEmail } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── Questions ────────────────────────────────────────────────────────────────

router.get('/questions', adminAuth, async (req, res) => {
  try {
    res.json(await readProblemsUnified())
  } catch {
    res.status(500).json({ error: 'Failed to read questions' })
  }
})

router.post('/questions', adminAuth, async (req, res) => {
  const { title, topic, difficulty, platform, url } = req.body
  if (!title || !topic || !difficulty || !platform || !url)
    return res.status(400).json({ error: 'title, topic, difficulty, platform, url are required' })
  try {
    const problems = await readProblemsUnified()
    const q        = normaliseProblem(req.body, problems)
    if (problems.find(p => p.problem_id === q.problem_id))
      return res.status(409).json({ error: `problem_id ${q.problem_id} already exists` })
    problems.push(q)
    await persistProblems(problems)
    res.status(201).json(q)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add question' })
  }
})

router.post('/questions/bulk', adminAuth, async (req, res) => {
  const { questions } = req.body
  if (!Array.isArray(questions) || questions.length === 0)
    return res.status(400).json({ error: 'questions array required' })
  try {
    const problems = await readProblemsUnified()
    const added    = []
    const skipped  = []

    for (const q of questions) {
      if (!q.title || !q.topic || !q.difficulty || !q.platform || !q.url) {
        skipped.push({ row: q, reason: 'missing required fields' })
        continue
      }
      const norm = normaliseProblem(q, [...problems, ...added])
      if (problems.find(p => p.problem_id === norm.problem_id) ||
          added.find(p => p.problem_id === norm.problem_id)) {
        skipped.push({ row: q, reason: `duplicate id ${norm.problem_id}` })
        continue
      }
      problems.push(norm)
      added.push(norm)
    }

    await persistProblems(problems)
    res.json({ added: added.length, skipped: skipped.length, addedItems: added, skippedItems: skipped })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Bulk import failed' })
  }
})

router.post('/questions/sync-db', adminAuth, async (req, res) => {
  try {
    const synced = await syncProblemsToDatabase()
    res.json({ synced })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to sync questions to database' })
  }
})

router.delete('/questions/:id', adminAuth, async (req, res) => {
  try {
    const problems = await readProblemsUnified()
    const idx      = problems.findIndex(p => p.problem_id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Question not found' })
    const [removed] = problems.splice(idx, 1)
    await persistProblems(problems)
    try {
      await deleteProblemFromDatabase(req.params.id)
    } catch (err) {
      console.warn('[admin] Failed to delete from DB:', err.message)
    }
    res.json({ removed })
  } catch {
    res.status(500).json({ error: 'Failed to delete question' })
  }
})

// ─── Topics ───────────────────────────────────────────────────────────────────

router.get('/topics', adminAuth, async (req, res) => {
  try {
    const problems = await readProblemsUnified()
    const data     = readTopics()
    const counts   = {}
    for (const p of problems)
      counts[p.topic] = (counts[p.topic] || 0) + 1
    res.json({ topics: data.topics, counts })
  } catch {
    res.status(500).json({ error: 'Failed to read topics' })
  }
})

router.post('/topics', adminAuth, async (req, res) => {
  const { topic } = req.body
  if (!topic || typeof topic !== 'string' || !topic.trim())
    return res.status(400).json({ error: 'topic name required' })
  try {
    const data = readTopics()
    const name = topic.trim()
    if (data.topics.includes(name))
      return res.status(409).json({ error: 'Topic already exists' })
    data.topics.push(name)
    data.last_updated = new Date().toISOString().split('T')[0]
    writeTopics(data)

    // Ask the Python recommendation service to reload topics so running
    // instances pick up the new topic without a full restart.
    try {
      await axios.post(`${py()}/admin/reload-topics`)
    } catch (err) {
      console.warn('[admin] Failed to notify Python service to reload topics:', err.message)
      // Continue — topic file was written successfully; the service can be
      // reloaded manually if needed.
    }

    res.status(201).json({ topic: name, topics: data.topics })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add topic' })
  }
})

module.exports = router
