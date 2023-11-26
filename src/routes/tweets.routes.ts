import { Router } from 'express'
import { createTweetController, getNewFeedsController, getTweetChildrenController, getTweetController } from '~/controllers/tweets.controllers'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator,
  tweetIDValidator
} from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
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
  audienceValidator,
  wrapRequestHandler(createTweetController)
)

tweetRouter.get(
  '/:tweet_id',
  tweetIDValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

tweetRouter.get(
  '/:tweet_id/children',
  tweetIDValidator,
  getTweetChildrenValidator,
  paginationValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)
tweetRouter.get(
  '/',
  paginationValidator,
  accessTokenValidator,
  isUserLoggedInValidator(verifiedUserValidator),
  wrapRequestHandler(getNewFeedsController)
)

export default tweetRouter
