import { check, checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { TWEET_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/commons'
import { validate } from '~/utils/validation'
import { Request, Response, NextFunction } from 'express'
import Tweet from '~/models/schemas/Tweet.schemas'
import { TokenPayload } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'
import { Verify } from 'crypto'
const tweetType = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)
const mediaType = numberEnumToArray(MediaType)
export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetType],
        errorMessage: TWEET_MESSAGES.INVALID_TYPE
      }
    },
    audience: {
      isIn: {
        options: [tweetAudience],
        errorMessage: TWEET_MESSAGES.INVALID_AUDIENCE
      }
    },
    parent_id: {
      custom: {
        options: async (value, { req }) => {
          const type = req.body.type as TweetType
          // Nếu type là retweet, comment, quotetweet thì parent_id phải là tweet_id của tweet cha
          if ([TweetType.ReTweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
          }
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_NULL)
          }
          const parent = await databaseService.tweet.findOne({
            _id: new ObjectId(value)
          })
          if (!parent) {
            console.log('parent', value)
            return true
          }
          return (req.tweet = parent as Tweet)
        }
      }
    },
    content: {
      isString: {
        errorMessage: TWEET_MESSAGES.CONTENT_MUST_BE_A_STRING
      },
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mention = req.body.mentions as string[]
          // Nếu type là comment, quotetwet, tweet và không có mention và hashtags thì content phải là string không được rỗng
          if (
            [TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mention) &&
            value === ''
          ) {
            throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
          }
          if (type === TweetType.ReTweet && value !== '') {
            throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_A_EMPTY_STRING)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: {
        errorMessage: TWEET_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY
      },
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong array là string
          if (!value.every((item: any) => typeof item === 'string')) {
            throw new Error(TWEET_MESSAGES.HASHTAGS_MUST_BE_STRING_ARRAY)
          }
          return true
        }
      }
    },
    mentions: {
      isArray: {
        errorMessage: TWEET_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY
      },
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong array là user_id
          if (!value.every((item: any) => ObjectId.isValid(item))) {
            throw new Error(TWEET_MESSAGES.MENTIONS_MUST_BE_USER_ID_ARRAY)
          }
          return true
        }
      }
    },
    medias: {
      isArray: {
        errorMessage: TWEET_MESSAGES.MEDIA_MUST_BE_AN_ARRAY
      },
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong array là Media
          if (
            !value.every((item: any) => {
              return typeof item.url !== 'string' || !mediaType.includes(item.type)
            })
          ) {
            throw new Error(TWEET_MESSAGES.MEDIA_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
          }
          return true
        }
      }
    }
  })
)

export const tweetIDValidator = validate(
  checkSchema(
    {
      tweet_id: {
        isMongoId: {
          errorMessage: TWEET_MESSAGES.INVALID_TWEET_ID
        },
        custom: {
          options: async (value, { req }) => {
            const [tweet] = await databaseService.tweet
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'likes'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_child'
                  }
                },
                {
                  $addFields: {
                    bookmarks: {
                      $size: '$bookmarks'
                    },
                    likes: {
                      $size: '$likes'
                    },
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_child',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 1]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_child',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 2]
                          }
                        }
                      }
                    },
                    quote_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_child',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 3]
                          }
                        }
                      }
                    }
                  }
                }
              ])
              .toArray()
            if (!tweet) {
              throw new ErrorWithStatus({ status: HTTP_STATUS.NOT_FOUND, message: TWEET_MESSAGES.TWEET_NOT_FOUND })
            }
            req.tweet = tweet
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

const audience = (tweet: Tweet) => {
  return wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (tweet.audience === TweetAudience.TweetCircle) {
      const author = await databaseService.users.findOne({
        _id: new ObjectId(tweet.user_id)
      })
      if (!author || author.verify === UserVerifyStatus.Banned) {
        throw new ErrorWithStatus({ status: HTTP_STATUS.NOT_FOUND, message: USER_MESSAGES.USER_NOT_FOUND })
      }
      if (req.decoded_authorization) {
        const { user_id } = req.decoded_authorization as TokenPayload
        const isInTwitterCircle = author.twitter_circle.some((user_circle_id) => user_circle_id.equals(user_id))
        if (!author._id.equals(user_id) && !isInTwitterCircle) {
          throw new ErrorWithStatus({ status: HTTP_STATUS.FORBIDDEN, message: TWEET_MESSAGES.TWEET_IS_NOT_PUBLIC })
        }
      }
      return next()
    }
  })
}

export const audienceValidator = async (req: Request, res: Response, next: NextFunction) => {
  audience(req.tweet as Tweet)(req, res, next)
}

export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetType],
          errorMessage: TWEET_MESSAGES.INVALID_TYPE
        }
      }
    },
    ['query']
  )
)

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: (value, { req }) => {
            const num = Number(value)
            if (num > 100 || num < 1) {
              throw new Error(TWEET_MESSAGES.LIMIT_MUST_BE_LESS_THAN_100_AND_GREATER_THAN_0)
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: (value, { req }) => {
            const num = Number(value)
            if (num < 1) {
              throw new Error(TWEET_MESSAGES.PAGE_MUST_BE_GREATER_THAN_0)
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)
