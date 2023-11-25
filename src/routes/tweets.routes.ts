import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controllers'
import { createTweetValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetRouter = Router()
/**
 * Description: Create a new tweet
 * Path: /tweets
 * Method: POST
 * Body: TweetReqeustBody
 * Header: {Authorization: Bearer <accessToken>}
 *  */
tweetRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

export default tweetRouter
