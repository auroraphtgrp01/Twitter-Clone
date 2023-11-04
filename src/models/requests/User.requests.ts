import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enums'

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
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}
