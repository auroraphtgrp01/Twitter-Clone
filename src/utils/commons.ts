import { JsonWebTokenError } from 'jsonwebtoken'
import { verifyToken } from './jwt'
import { Request } from 'express'
import { ErrorWithStatus } from '~/models/Errors'
import { USER_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
export const numberEnumToArray = (numberEnum: { [key: string]: string | number }) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number') as number[]
}

export const verifyAccessToken = async (access_token: string, req?: Request) => {
  if (!access_token) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
  try {
    const decoded_authorization = await verifyToken({
      token: access_token,
      secretOnPublicKey: process.env.JWT_ACCESS_TOKEN_SECRET
    })
    if (req) {
      req.decoded_authorization = decoded_authorization
      return true
    }
    return decoded_authorization
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.ACCESS_TOKEN_IS_IN_INVAILD,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }
    throw error
  }
}
