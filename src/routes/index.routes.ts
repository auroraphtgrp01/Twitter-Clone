import express, { Router } from 'express'
import likeRouter from './like.routes'
import bookmarkRouter from './bookmark.routes'
import usersRoutes from './users.routes'
import mediasRoutes from './medias.routes'
import tweetRouter from './tweets.routes'
import staticRoutes from './static.routes'
import { UPLOAD_VIDEO_DIR } from '~/constants/dir'
import searchRouter from './search.routes'
import conversationRouter from './conversation.routes'
import bodyParser from 'body-parser'

export const RouterApp = async (useRoute: express.Application) => {
  const bodyParserJson = bodyParser.json()
  useRoute.use('/user', bodyParserJson, usersRoutes)
  useRoute.use('/medias', bodyParserJson, mediasRoutes)
  useRoute.use('/tweet', bodyParserJson, tweetRouter)
  useRoute.use('/likes', bodyParserJson, likeRouter)
  useRoute.use('/bookmarks', bodyParserJson, bookmarkRouter)
  useRoute.use('/static', bodyParserJson, staticRoutes)
  useRoute.use('/static/video', bodyParserJson, express.static(UPLOAD_VIDEO_DIR))
  useRoute.use('/search', bodyParserJson, searchRouter)
  useRoute.use('/conversation', bodyParserJson, conversationRouter)
}
