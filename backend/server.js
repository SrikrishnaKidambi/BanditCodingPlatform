require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes     = require('./routes/auth')
const recommendRoutes = require('./routes/recommend')
const historyRoutes  = require('./routes/history')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api', recommendRoutes)
app.use('/api', historyRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
