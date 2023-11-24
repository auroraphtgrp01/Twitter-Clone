import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import config from 'dotenv'
import { TweetRequestBody } from '~/models/requests/Tweet.request'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  return res.json({ message: 'createTweetController' })
}