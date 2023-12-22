import express from 'express'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import cors from 'cors'
import { RouterApp } from './routes/index.routes'
import { createServer } from 'http'
// import 'src/utils/faker'
import { rateLimit } from 'express-rate-limit'
import './utils/s3'
import initSocket from './utils/socket'
import helmet from 'helmet'
config()
const app = express()
app.use(express.json())
app.get('/', (req, res) => {
  console.log(req.body)
  console.log('hello')
  res.json({ message: 'hello' })
})
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Use an external store for consistency across multiple server instances.
})
const port = process.env.PORT || 4000
const httpServer = createServer(app)

initFolder()
app.use(limiter)
app.use(helmet())
app.use(cors())
databaseService.connect().then(() => {
  databaseService.indexeUser()
  databaseService.indexRefreshToken()
  databaseService.indexVideoStatus()
  databaseService.indexFollowers()
  databaseService.indexTweet()
})
RouterApp(app)
app.use(defaultErrorHandler)
initSocket(httpServer)
// app.listen(port, () => {
//   conole.log(`Listening on port ${port}`)
// })
httpServer.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
