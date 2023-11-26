import { TweetRequestBody } from '~/models/requests/Tweet.request'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schemas'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schemas'
import { TweetType } from '~/constants/enums'
import { TokenPayload } from '~/models/requests/User.requests'

class TweetService {
  async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtag.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: new Hashtag({ name: hashtag }) },
          { upsert: true, returnDocument: 'after' }
        )
      })
    )
    return hashtagDocuments.map((hashtag) => (hashtag as WithId<Hashtag>)._id)
  }
  createTweet = async (body: TweetRequestBody, user_id: string) => {
    const hashtag = await this.checkAndCreateHashtags(body.hashtags)
    console.log('hashtag', hashtag)
    const result = await databaseService.tweet.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        mentions: body.mentions,
        hashtags: hashtag,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    return result
  }
  async increaseTweetViews(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.tweet.findOneAndUpdate(
      {
        _id: new ObjectId(tweet_id)
      },
      {
        $inc: inc,
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        projection: {
          user_views: 1,
          guest_views: 1,
          updated_at: 1
        }
      }
    )
    return result as WithId<{
      user_views?: number
      guest_views?: number
      updated_at: Date
    }>
  }
  async getTweetChildren({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  }: {
    tweet_id: string
    tweet_type: TweetType
    limit: number
    page: number
    user_id?: string
  }) {
    const tweet = await databaseService.tweet
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: TweetType.Comment
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
                    $eq: ['$$item.type', TweetType.ReTweet]
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
                    $eq: ['$$item.type', TweetType.Comment]
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
                    $eq: ['$$item.type', TweetType.QuoteTweet]
                  }
                }
              }
            }
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    const tweetIds = tweet.map((item) => item._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()
    const [count] = await Promise.all([
      databaseService.tweet.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      }),
      databaseService.tweet.updateMany(
        {
          _id: {
            $in: tweetIds
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      )
    ])
    const total = Math.ceil(count / limit)
    tweet.forEach((item) => {
      item.updated_at = date
      if (user_id) {
        ; (item.user_views as number) += 1
      } else {
        ; (item.guest_views as number) += 1
      }
    })
    return {
      total,
      tweet
    }
  }
  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const followed_user_ids = await databaseService.followers.find({
      user_id: new ObjectId(user_id)
    }, {
      projection: {
        followed_user_id: 1,
        _id: 0
      }
    }).toArray()
    const ids = followed_user_ids.map((item) => item.followed_user_id)
    ids.push(new ObjectId(user_id))
    return ids
  }
}

const tweetServices = new TweetService()
export default tweetServices
