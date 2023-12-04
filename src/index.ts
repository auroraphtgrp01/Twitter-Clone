import express from 'express'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import cors from 'cors'
import { RouterApp } from './routes/index.routes'
// import 'src/utils/faker'
import './utils/s3'
config()
const app = express()
const port = process.env.PORT || 4000

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

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
