import { Router } from 'express'
import { likeTweetController, unlikeTweetController } from '~/controllers/like.controllers'
import { tweetIDValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const likeRouter = Router()

likeRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIDValidator,
  wrapRequestHandler(likeTweetController)
)

likeRouter.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIDValidator,
  wrapRequestHandler(unlikeTweetController)
)

export default likeRouter
