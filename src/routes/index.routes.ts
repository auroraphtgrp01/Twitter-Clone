import express, { Router } from 'express'
import likeRouter from './like.routes'
import bookmarkRouter from './bookmark.routes'
import usersRoutes from './users.routes'
import mediasRoutes from './medias.routes'
import tweetRouter from './tweets.routes'
import staticRoutes from './static.routes'
import { UPLOAD_VIDEO_DIR } from '~/constants/dir'
import searchRouter from './search.routes'

export const RouterApp = async (useRoute: express.Application) => {
  useRoute.use('/user', usersRoutes)
  useRoute.use('/medias', mediasRoutes)
  useRoute.use('/tweet', tweetRouter)
  useRoute.use('/likes', likeRouter)
  useRoute.use('/bookmarks', bookmarkRouter)
  useRoute.use('/static', staticRoutes)
  useRoute.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
  useRoute.use('/search', searchRouter)
}
