require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes      = require('./routes/auth')
const recommendRoutes = require('./routes/recommend')
const historyRoutes   = require('./routes/history')
const adminRoutes     = require('./routes/admin')
const internalRoutes  = require('./routes/internal')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api', recommendRoutes)
app.use('/api', historyRoutes)
app.use('/api/internal', internalRoutes)
app.use('/admin', adminRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
