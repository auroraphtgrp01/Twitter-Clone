import User from '~/models/schemas/User.schemas'
import databaseService from './database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schemas'
import { ObjectId, ReturnDocument } from 'mongodb'
import { RegisterRequestBody, UpdateMeRequestBody } from '~/models/requests/User.requests'
import { USER_MESSAGES } from '~/constants/messages'
import Followers from '~/models/schemas/Follower.schemas'
import { ErrorWithStatus } from '~/models/Errors'
import axios from 'axios'
import HTTP_STATUS from '~/constants/httpStatus'

class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_ACCESS_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN
      }
    })
  }
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.RefressToken
      },
      privateKey: process.env.JWT_REFRESH_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN
      }
    })
  }
  private signEmailVerifyToken({
    user_id,
    verify = UserVerifyStatus.Unverified
  }: {
    user_id: string
    verify: UserVerifyStatus
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefressToken,
        verify
      },
      privateKey: process.env.JWT_EMAIL_VERIFY_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN
      }
    })
  }
  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN
      }
    })
  }
  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }
  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    try {
      const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return data as {
        access_token: string
        id_token: string
      }
    } catch (error) {
      console.log('error: ' + error)
    }
    return {
      access_token: '',
      id_token: 'string'
    } as {
      access_token: string
      id_token: string
    }
  }
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    try {
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        params: {
          access_token,
          alt: 'json'
        },
        headers: {
          Authorization: `Bearer ${id_token}`
        }
      })
      return data as {
        id: string
        email: string
        verified_email: boolean
        name: string
        given_name: string
        family_name: string
        picture: string
        locale: string
      }
    } catch (error) {
      console.log('error: ' + error)
    }
  }
  async register(payload: RegisterRequestBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: (user_id as ObjectId).toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        email_verify_token
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: (user_id as ObjectId).toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    console.log('email' + email_verify_token)

    return {
      access_token,
      refresh_token
    }
  }
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }
  async oauth(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo?.verified_email) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    // Check Email Exits
    const user = await databaseService.users.findOne({
      email: userInfo.email
    })
    // Neu ton tai thi login vao
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({
          user_id: user._id,
          token: refresh_token
        })
      )
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify
      }
    } else {
      const password = Math.random().toString(36).substring(2, 25)
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      })
      return {
        ...data,
        newUser: 1,
        verify: UserVerifyStatus.Unverified
      }
    }
    // Khong thi tao moi
    console.log('user info: ' + JSON.stringify(userInfo))
  }
  async checkEmailExits(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
  }
  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            email_verify_token: '',
            // updated_at: new Date(),
            verify: UserVerifyStatus.Verified
          },
          $currentDate: { updated_at: true }
        }
      )
    ])
    const [access_token, refresh_token] = token
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }
  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    console.log('email token: ' + email_verify_token)
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          email_verify_token
        },
        $currentDate: { updated_at: true }
      }
    )
    return 1
  }
  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: token
        },
        $currentDate: { updated_at: true }
      }
    )
    // send email
    console.log('forgot password token: ' + token)
    return {
      message: USER_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD,
      forgot_password_token: token
    }
  }
  async resetPassword(user_id: string, password: string) {
    const result = await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USER_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }
  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0
        }
      }
    )
    return {
      message: USER_MESSAGES.GET_ME_SUCCESS,
      user
    }
  }
  async updateMe(user_id: string, payload: UpdateMeRequestBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(_payload as UpdateMeRequestBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0
        }
      }
    )
    return user
  }
  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower === null) {
      const user = await databaseService.followers.insertOne(
        new Followers({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
      return {
        user
      }
    }
    return {
      message: USER_MESSAGES.FOLLOWED_BEFORE
    }
  }
  async unfollow(userid: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(userid),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower === null) {
      return {
        message: USER_MESSAGES.ALREADY_UNFOLLOWED
      }
    }
    const result = await databaseService.followers.deleteOne({
      user_id: new ObjectId(userid),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USER_MESSAGES.UNFOLLOW_SUCCESS
    }
  }
  async changePassword(user_id: string, password: string) {
    const result = await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USER_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }
}

const usersService = new UsersService()
export default usersService
