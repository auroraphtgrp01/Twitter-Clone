import argv from 'minimist'
const options = argv(process.argv.slice(2))
import { config } from 'dotenv'
config()
export const __IS_PRODUCTION__ = Boolean(options.production)
export const __IS_DEVELOPMENT__ = !__IS_PRODUCTION__


// export const envConfig = {
//   port: (process.env.PORT as string) || '4000',
//   host: (process.env.HOST as string),
//   dbName: (process.env.DB_NAME as string),
//   dbUserName: (process.env.DB_USERNAME as string),
//   dbPassword: (process.env.DB_PASSWORD as string),
//   dbTweetCollectionName: (process.env.DB_TWEET_COLLECTION_NAME as string),
// }
