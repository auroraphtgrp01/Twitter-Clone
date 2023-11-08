/* eslint-disable prettier/prettier */
import { NextFunction, Request, Response } from 'express'
import { ParamSchema, check, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { REGEX_USERNAME } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG,
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  }
}
const confirmPasswordSchema: ParamSchema = {
  errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG,
  notEmpty: {
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USER_MESSAGES.PASSWORDS_DO_NOT_MATCH)
      } else {
        return true
      }
    }
  }
}
const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  notEmpty: {
    errorMessage: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED
  },
  custom: {
    options: async (value, { req }) => {
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOnPublicKey: process.env.JWT_FORGOT_PASSWORD_TOKEN as string,
        })
        const { user_id } = decoded_forgot_password_token
        const user = await databaseService.users.findOne({
          _id: new ObjectId(user_id)
        })
        if (!user) {
          throw new ErrorWithStatus({
            message: USER_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        req.decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID
            , status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        throw error
      }
    }
  }
}
const imageUrlSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.IMAGE_URL_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USER_MESSAGES.IMAGE_URL_MUST_BE_FROM_1_TO_400
  }
}
const nameSchema: ParamSchema = {
  isString: {
    errorMessage: USER_MESSAGES.NAME_MUST_BE_A_STRING
  },
  notEmpty: {
    errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USER_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  }
}
const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USER_MESSAGES.DATE_OF_BIRTH_IS_ISO8601
  }
}
const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.INVALID_USER_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      const followed_user = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })
      if (followed_user === null) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }
  }
}
export const loginValidator = validate(
  checkSchema({
    email: {
      trim: true,
      isEmail: {
        errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
      },
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({
            email: value,
            password: hashPassword(req.body.password)
          })
          if (user === null) {
            throw new Error(USER_MESSAGES.EMAIL_OR_PASSWORD_IS_INVALID)
          }
          req.user = user
          return true
        }
      }
    },
    password: {
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG,
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      }
    }
  }, ['body'])
)

export const registerValidator = validate(
  checkSchema({
    name: nameSchema,
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
      },
      trim: true,
      isEmail: {
        errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
      },
      custom: {
        options: async (value) => {
          const isExitsEmail = await usersService.checkEmailExits(value)
          if (isExitsEmail) {
            throw new Error(USER_MESSAGES.EMAIL_ALREADY_EXISTS)
          }
          return true
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    date_of_birth: dateOfBirthSchema
  }, ['body'])
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        notEmpty: {
          errorMessage: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_authorization = await verifyToken({ token: access_token, secretOnPublicKey: process.env.JWT_ACCESS_TOKEN_SECRET });
              req.decoded_authorization = decoded_authorization
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.ACCESS_TOKEN_IS_IN_INVAILD,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              } throw error
            }
            return true
          }
        }
      }
    }, ['headers']))


export const refreshTokenValidator = validate(
  checkSchema({
    refresh_token: {
      notEmpty: {
        errorMessage: USER_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.REFRESH_TOKEN_MUST_A_STRING
      },
      custom: {
        options: async (value, { req }) => {
          try {
            const [decoded_refresh_token, refresh_token] = await Promise.all([
              verifyToken({ token: value, secretOnPublicKey: process.env.JWT_REFRESH_TOKEN_SECRET }),
              databaseService.refreshTokens.findOne({ token: value })
            ])
            if (refresh_token === null) {
              throw new ErrorWithStatus({ message: USER_MESSAGES.REFRESH_TOKEN_NOT_EXITS, status: HTTP_STATUS.UNAUTHORIZED })
            }
            req.decoded_refresh_token = decoded_refresh_token
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({ message: USER_MESSAGES.REFRESH_TOKEN_INVALID, status: HTTP_STATUS.UNAUTHORIZED })
            }
            throw error
          }
        }
      }
    }
  }, ['body']))

export const emailVerifyToken = validate(
  checkSchema({
    email_verify_token: {
      notEmpty: {
        errorMessage: USER_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED
      },
      custom: {
        options: async (value, { req }) => {
          const decoded_email_verify_token = await verifyToken({ token: value, secretOnPublicKey: process.env.JWT_EMAIL_VERIFY_TOKEN_SECRET })
          req.decoded_email_verify_token = decoded_email_verify_token
        }
      }
    }
  }, ['body']))

export const forgotPasswordValidator = validate(checkSchema({
  email: {
    trim: true,
    isEmail: {
      errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
    },
    custom: {
      options: async (value, { req }) => {
        const user = await databaseService.users.findOne({
          email: value,
        })
        if (user === null) {
          throw new Error(USER_MESSAGES.USER_NOT_FOUND)
        }
        req.user = user
        return true
      }
    }
  }
}, ['body']))

export const verifyForgotPasswordTokenValidator = validate(checkSchema({
  forgot_password_token: forgotPasswordTokenSchema
}, ['body']))

export const resetPasswordValidator = validate(checkSchema({
  password: passwordSchema,
  confirm_password: confirmPasswordSchema,
  forgot_password_token: forgotPasswordTokenSchema
}, ['body']))

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    return next(new ErrorWithStatus({
      message: USER_MESSAGES.USER_NOT_VERIFIED,
      status: HTTP_STATUS.FORBIDDEN
    }))
  }
  next()
}

export const updateMeValidator = validate(checkSchema({
  name: {
    ...nameSchema,
    optional: true,
    notEmpty: undefined
  },
  date_of_birth: {
    ...dateOfBirthSchema,
    optional: true,
    notEmpty: undefined
  },
  bio: {
    optional: true,
    isString: {
      errorMessage: USER_MESSAGES.BIO_MUST_BE_A_STRING
    },
    trim: true,
    isLength: {
      options: {
        min: 1,
        max: 200
      },
      errorMessage: USER_MESSAGES.BIO_LENGTH_MUST_BE_FROM_1_TO_200
    }
  },
  location: {
    optional: true,
    isString: {
      errorMessage: USER_MESSAGES.LOCATION_MUST_BE_A_STRING
    },
    trim: true,
    isLength: {
      options: {
        min: 1,
        max: 200
      },
      errorMessage: USER_MESSAGES.LOCATION_LENGTH_MUST_BE_FROM_1_TO_200
    }
  },
  website: {
    optional: true,
    isString: {
      errorMessage: USER_MESSAGES.WEBSITE_MUST_BE_A_STRING
    },
    trim: true,
    isLength: {
      options: {
        min: 1,
        max: 100
      },
      errorMessage: USER_MESSAGES.WEBSITE_LENGTH_MUST_BE_FROM_1_TO_100
    }
  },
  username: {
    optional: true,
    isString: {
      errorMessage: USER_MESSAGES.USERNAME_MUST_BE_A_STRING
    },
    trim: true,
    custom: {
      options: async (value: string, { req }) => {
        if (!REGEX_USERNAME.test(value)) {
          throw new Error(USER_MESSAGES.USERNAME_IS_INVALID)
        }
        const user = await databaseService.users.findOne({
          username: value
        })
        if (user) {
          throw new Error(USER_MESSAGES.USERNAME_ALREADY_EXISTS)
        }
      }
    },
    isLength: {
      options: {
        min: 1,
        max: 50
      },
      errorMessage: USER_MESSAGES.USERNAME_LENGTH_MUST_BE_FROM_1_TO_50
    }
  },
  avatar: imageUrlSchema,
  cover_photo: imageUrlSchema
}))

export const followValidator = validate(checkSchema({
  followed_user_id: userIdSchema
}, ['body']))

export const unFollowValidator = validate(checkSchema({
  user_id: userIdSchema
}, ['params']))

export const changePasswordValidator = validate(checkSchema({
  old_password: {
    ...passwordSchema,
    custom: {
      options: async (value: string, { req }) => {
        const { user_id } = req.decoded_authorization as TokenPayload
        const user = await databaseService.users.findOne({
          _id: new ObjectId(user_id)
        })
        const checkPass = hashPassword(value) === user?.password
        if (!checkPass) {
          throw new Error(USER_MESSAGES.OLD_PASSWORD_IS_INCORRECT)
        }
        return true
      }
    }
  },
  password: passwordSchema,
  confirm_password: confirmPasswordSchema
}, ['body']))