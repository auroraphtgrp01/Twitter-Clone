import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { ParamsDictionary } from 'express-serve-static-core'
export interface LoginRequestBody {
  email: string
  password: string
}
export interface RegisterRequestBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface LogoutRequestBody {
  refresh_token: string
}

export interface VerifyEmailRequestBody {
  email_verify_token: string
}


export interface ForgotPasswordRequestBody {
  email: string
  _id: string
}

export interface ResetPasswordRequestBody {
  password: string
  email: string
  forgot_password_token: string
}
export interface TokenPayload extends JwtPayload {
  user_id: string
  verify: UserVerifyStatus
  token_type: TokenType
}

export interface UpdateMeRequestBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

export interface FollowRequestBody {
  followed_user_id: string
}

export interface UnfollowRequestParams extends ParamsDictionary {
  user_id: string
}

export interface changePasswordRequestBody {
  old_password: string
  password: string
  confirm_password: string
}

export interface RefreshTokenRequestBody {
  refresh_token: string
}