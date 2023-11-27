import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '../Others'
import { ParamsDictionary } from 'express-serve-static-core'
import { Query } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
export interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string
  hashtags: string[]
  mentions: string[]
  medias: Media[]
  user_id?: ObjectId
}

export interface TweetParam extends ParamsDictionary {
  tweet_id: string
}

export interface TweetQuery extends Query, Pagination {
  tweet_type: string
}

export interface Pagination {
  limit: string
  page: string
}
