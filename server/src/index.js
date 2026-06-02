import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { router as apiRouter } from './routes/api.js'
import { webhookRouter } from './routes/webhooks.js'

const app = express()
const PORT = process.env.PORT || 4000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
}))

// Mux webhook needs raw body — must be before express.json()
app.use(webhookRouter)

app.use(express.json())

app.use('/api', apiRouter)

app.listen(PORT, () => {
  console.log(`Breath Connection server running on http://localhost:${PORT}`)
})
