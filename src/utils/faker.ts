import { faker } from '@faker-js/faker'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import { RegisterRequestBody } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import User from '~/models/schemas/User.schemas'
import { hashPassword } from './crypto'
import { random } from 'lodash'
import Followers from '~/models/schemas/Follower.schemas'
import tweetServices from '~/services/tweets.services'

const PASSWORD = 'Minhtuan4869@@'
const MYID = new ObjectId('65631e6bc474dbe4b3387fbf')
const USER_COUNT = 1000

const createRandomUser = () => {
  const user: RegisterRequestBody = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirm_password: PASSWORD,
    date_of_birth: faker.date.past().toISOString()
  }
  return user
}

const user: RegisterRequestBody[] = faker.helpers.multiple(createRandomUser, {
  count: USER_COUNT
})

const insertMultipleUsers = async (users: RegisterRequestBody[]) => {
  const result = Promise.all(
    users.map(async (user) => {
      const user_id = new ObjectId()
      await databaseService.users.insertOne(
        new User({
          ...user,
          username: user.email.split('@')[0] + random(1000, 9999),
          password: hashPassword(user.password),
          date_of_birth: new Date(user.date_of_birth),
          verify: UserVerifyStatus.Verified,
          _id: user_id
        })
      )
      return user_id
    })
  )
  return result
}

const followMultipleUsers = async (user_id: ObjectId, follow_user_ids: ObjectId[]) => {
  console.log('Follow multiple users')
  const result = await Promise.all(
    follow_user_ids.map((follow_user_id) => {
      databaseService.followers.insertOne(
        new Followers({
          user_id,
          followed_user_id: new ObjectId(follow_user_id)
        })
      )
    })
  )
  console.log('Follow multiple users successfully')
}

const createRandomTweet = (user_id: ObjectId) => {
  console.log(user_id.toString())
  const tweet: TweetRequestBody = {
    type: TweetType.Tweet,
    audience: TweetAudience.Everyone,
    content: faker.lorem.paragraph({
      min: 10,
      max: 160
    }),
    hashtags: [],
    medias: [],
    mentions: [],
    parent_id: null,
    user_id
  }
  return tweet
}
const insertMultipleTweets = async (ids: ObjectId[]) => {
  console.log('Create multiple tweets')
  const result = await Promise.all(
    ids.map(async (id, index) => {
      await Promise.all([tweetServices.createTweet(createRandomTweet(id), id.toString())])
      await Promise.all([tweetServices.createTweet(createRandomTweet(id), id.toString())])
    })
  )
  console.log('Create multiple tweets successfully')
  return result
}

insertMultipleUsers(user).then((ids) => {
  console.log('ids', ids)
  insertMultipleTweets(ids)
  followMultipleUsers(new ObjectId(MYID), ids)
  console.log('Faker Done')
})
