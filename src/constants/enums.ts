import e from 'express'

export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}
export enum TokenType {
  AccessToken,
  RefressToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MediaType {
  Image,
  Video,
  HLS
}

export enum MediaQueryType {
  Image = 'image',
  Video = 'video'
}

export enum EncodingStatus {
  Pending,
  Processing,
  Success,
  Failed
}

export enum TweetType {
  Tweet,
  ReTweet,
  Comment,
  QuoteTweet
}

export enum TweetAudience {
  Everyone,
  TweetCircle
}

export enum PeopleFollow {
  Anyone = '0',
  Following = '1'
}
