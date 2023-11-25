import { Router } from 'express'
import { bookmarkTweetController, unBookmarkTweetController } from '~/controllers/bookmarks.controllers'
import { tweetIDValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarkRouter = Router()
/**
 * Description: Bookmark a tweet
 * Path: /bookmark
 * Method: POST
 * Body: {tweet_id: string}
 * Header: {Authorization: Bearer <accessToken>}
 *  */
bookmarkRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIDValidator,
  wrapRequestHandler(bookmarkTweetController)
)
/**
 * Description: unBookmark a tweet
 * Path: /:tweet-id'
 * Method: POST
 * Body: {tweet_id: string}
 * Header: {Authorization: Bearer <accessToken>}
 *  */
bookmarkRouter.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIDValidator,
  wrapRequestHandler(unBookmarkTweetController)
)
export default bookmarkRouter
