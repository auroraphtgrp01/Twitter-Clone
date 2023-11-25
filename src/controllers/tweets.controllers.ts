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
  return res.json({
    menubar: 'Hello World'
  })
}