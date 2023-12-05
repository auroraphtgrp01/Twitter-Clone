import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import {
  LoginRequestBody,
  LogoutRequestBody,
  RegisterRequestBody,
  TokenPayload,
  VerifyEmailRequestBody,
  ForgotPasswordRequestBody,
  ResetPasswordRequestBody,
  UpdateMeRequestBody,
  FollowRequestBody,
  UnfollowRequestParams,
  changePasswordRequestBody,
  RefreshTokenRequestBody
} from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schemas'
import { USER_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'
import { pick } from 'lodash'
import { config } from 'dotenv'
config()

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify })
  return res.json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const result = await usersService.oauth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK as string}?access_token=${
    result.access_token
  }&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`
  return res.redirect(urlRedirect)
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.json({ message: USER_MESSAGES.REGISTER_SUCCESS, result })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutRequestBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  return res.json({
    message: USER_MESSAGES.LOGOUT_SUCCESS,
    result
  })
}

export const verifyEmailController = async (
  req: Request<ParamsDictionary, any, VerifyEmailRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.USER_NOT_FOUND
    })
  }
  if (user.email_verify_token === '') {
    return res.json({
      message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USER_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const deleteDBController = async (req: Request, res: Response) => {
  try {
    await databaseService.users.deleteMany({})
    await databaseService.refreshTokens.deleteMany({})
    res.json({
      message: 'Delete DB Success'
    })
  } catch (error) {
    res.json(error)
  }
}

export const resendVerifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.USER_NOT_FOUND
    })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.OK).json({
      message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }
  await usersService.resendVerifyEmail(user_id, user.email)
  return res.json({
    message: USER_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
  })
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id } = req.user as User
  const result = await usersService.forgotPassword({
    user_id: (_id as ObjectId).toString(),
    verify: (req.user as User).verify as UserVerifyStatus,
    email: (req.user as User).email
  })
  return res.json(result)
}

export const verifyForgotPasswordToken = async (req: Request, res: Response, next: NextFunction) => {
  return res.json({
    message: USER_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await usersService.resetPassword(user_id, password)
  return res.json(result)
}

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.getMe(user_id)
  return res.json(result)
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { body } = req
  const user = await usersService.updateMe(user_id, body)
  return res.json({
    message: USER_MESSAGES.UPDATE_ME_SUCCESS,
    user
  })
}

export const followController = async (
  req: Request<ParamsDictionary, any, FollowRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body
  if (user_id === followed_user_id) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.CANNOT_FOLLOW_YOURSELF,
      status: 404
    })
  }
  const result = await usersService.follow(user_id, followed_user_id)
  return res.json({
    message: USER_MESSAGES.FOLLOW_SUCCESS,
    result
  })
}

export const unfollowController = async (
  req: Request<ParamsDictionary, any, UnfollowRequestParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { user_id: followed_user_id } = req.params
  const result = await usersService.unfollow(user_id, followed_user_id)
  res.json(result)
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, changePasswordRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  const result = await usersService.changePassword(user_id, password)
  res.json(result)
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload
  const { refresh_token } = req.body
  const result = await usersService.refreshToken({ user_id, verify, refresh_token, exp })
  return res.json({
    message: USER_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}
