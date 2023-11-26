import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import config from 'dotenv'
import { TweetParam, TweetQuery, TweetRequestBody } from '~/models/requests/Tweet.request'
import tweetServices from '~/services/tweets.services'
import { TokenPayload } from '~/models/requests/User.requests'
import { TWEET_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { TweetType } from '~/constants/enums'

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

export const getTweetChildrenController = async (req: Request<TweetParam, any, TweetQuery>, res: Response) => {
  const tweet_id = req.params.tweet_id
  const tweet_type = Number(req.query.tweet_type)
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const { user_id } = req.decoded_authorization as TokenPayload
  const { total, tweet } = await tweetServices.getTweetChildren({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  })
  return res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESSFULLY,
    tweet: tweet,
    limit: limit,
    page: page,
    total: total
  })
}

export const getNewFeedsController = async (req: Request<ParamsDictionary, any, TweetQuery>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const result = await tweetServices.getNewFeeds({ user_id: user_id, limit, page })
  res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESSFULLY,
    result
  })
}