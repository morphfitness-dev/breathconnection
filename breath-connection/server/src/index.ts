import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import meRouter from './routes/me'

const app = express()
const PORT = process.env.PORT ?? 3001
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', meRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
