import express from 'express'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import cors from 'cors'
import { RouterApp } from './routes/index.routes'
import { createServer } from 'http'
import { Server } from 'socket.io'
// import 'src/utils/faker'
import './utils/s3'
import initSocket from './utils/socket'
config()
const app = express()
const port = process.env.PORT || 4000
const httpServer = createServer(app)

initFolder()
app.use(cors())
databaseService.connect().then(() => {
  databaseService.indexeUser()
  databaseService.indexRefreshToken()
  databaseService.indexVideoStatus()
  databaseService.indexFollowers()
  databaseService.indexTweet()
})
app.use(express.json())
RouterApp(app)
app.use(defaultErrorHandler)
initSocket(httpServer)
// app.listen(port, () => {
//   console.log(`Listening on port ${port}`)
// })
httpServer.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
