import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { router as apiRouter } from './routes/api.js'

const app = express()
const PORT = process.env.PORT || 4000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
}))
app.use(express.json())

app.use('/api', apiRouter)

app.listen(PORT, () => {
  console.log(`Breath Connection server running on http://localhost:${PORT}`)
})
