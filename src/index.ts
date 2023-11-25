import express from 'express'
import userRoutes from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import mediasRoutes from './routes/medias.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import { UPLOAD_VIDEO_DIR } from './constants/dir'
import staticRoutes from './routes/static.routes'
import cors from 'cors'
import tweetRouter from './routes/tweets.routes'
import bookmarkRouter from './routes/bookmark.routes'
import likeRouter from './routes/like.routes'
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
})
app.use(express.json())
app.use('/user', userRoutes)
app.use('/medias', mediasRoutes)
app.use('/tweet', tweetRouter)
app.use('/bookmarks', bookmarkRouter)
app.use('/likes', likeRouter)
app.use('/static', staticRoutes)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
