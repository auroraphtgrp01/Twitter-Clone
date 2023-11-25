import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import config from 'dotenv'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import tweetServices from '~/services/tweets.services'
import { TokenPayload } from '~/models/requests/User.requests'
import { TWEET_MESSAGES } from '~/constants/messages'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetServices.createTweet(req.body, user_id)
  return res.json({
    message: TWEET_MESSAGES.CREATE_TWEET_SUCCESSFULLY,
    result
  })
}

export const getTweetController = async (req: Request, res: Response) => {
  const increaseView = await tweetServices.increaseTweetViews(req.params.tweet_id, req.decoded_authorization?.user_id)
  const result = {
    ...req.tweet,
    ...increaseView
  }
  return res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESSFULLY,
    result
  })
}
