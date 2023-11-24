export const USER_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  EMAIL_OR_PASSWORD_IS_INVALID: 'Email or password is invalid',
  VALIDATION_ERROR: 'Validation Error',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Password length must be from 6 to 50',
  PASSWORD_MUST_BE_STRONG:
    'Password must be 6 - 50 characters long and contain at least 1 lowercase, 1 uppercase, 1 number and 1 symbol',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Confirm password length must be from 6 to 50',
  CONFIRM_PASSWORD_MUST_BE_STRONG:
    'Confirm password must be 6 - 50 characters long and contain at least 1 lowercase, 1 uppercase, 1 number and 1 symbol',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  DATE_OF_BIRTH_IS_ISO8601: 'Date of birth must be ISO8601',
  LOGIN_SUCCESS: 'Login success',
  REGISTER_SUCCESS: 'Register success',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_MUST_A_STRING: 'Refresh token must be a string',
  REFRESH_TOKEN_INVALID: 'Refresh token invalid',
  LOGOUT_SUCCESS: 'Logout success',
  REFRESH_TOKEN_NOT_EXITS: 'Refresh token not exits',
  ACCESS_TOKEN_IS_IN_INVAILD: 'Access token is invalid',
  EMAIL_VERIFY_SUCCESS: 'Email verify success',
  EMAIL_VERIFY_FAIL: 'Email verify fail',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
  EMAIL_VERIFY_TOKEN_IS_INVALID: 'Email verify token is invalid',
  EMAIL_VERIFY_TOKEN_IS_EXPIRED: 'Email verify token is expired',
  EMAIL_VERIFY_TOKEN_IS_NOT_FOUND: 'Email verify token is not found',
  EMAIL_VERIFY_TOKEN_IS_NOT_MATCH: 'Email verify token is not match',
  EMAIL_VERIFY_TOKEN_IS_NOT_MATCH_WITH_EMAIL: 'Email verify token is not match with email',
  EMAIL_VERIFY_TOKEN_IS_NOT_MATCH_WITH_USER: 'Email verify token is not match with user',
  EMAIL_VERIFY_TOKEN_IS_NOT_MATCH_WITH_USER_EMAIL: 'Email verify token is not match with user email',
  EMAIL_VERIFY_TOKEN_IS_NOT_MATCH_WITH_USER_EMAIL_VERIFY_TOKEN:
    'Email verify token is not match with user email verify token',
  EMAIL_ALREADY_VERIFIED: 'Email already verified',
  RESEND_VERIFY_EMAIL_SUCCESS: 'Resend verify email success',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Verify forgot password token validator',
  FORGOT_PASSWORD_TOKEN_IS_INVALID: 'Forgot password token is invalid',
  VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS: 'Verify forgot password token success',
  RESET_PASSWORD_SUCCESS: 'Reset password success',
  GET_ME_SUCCESS: 'Get my profile success',
  USER_NOT_VERIFIED: 'User not verified',
  BIO_MUST_BE_A_STRING: 'Bio must be a string',
  BIO_LENGTH_MUST_BE_FROM_1_TO_200: 'Bio length must be from 1 to 200',
  LOCATION_MUST_BE_A_STRING: 'Location must be a string',
  LOCATION_LENGTH_MUST_BE_FROM_1_TO_200: 'Location length must be from 1 to 200',
  WEBSITE_MUST_BE_A_STRING: 'Website must be a string',
  WEBSITE_LENGTH_MUST_BE_FROM_1_TO_100: 'Website length must be from 1 to 100',
  USERNAME_MUST_BE_A_STRING: 'Username must be a string',
  USERNAME_LENGTH_MUST_BE_FROM_1_TO_50: 'Username length must be from 1 to 50',
  IMAGE_URL_MUST_BE_A_STRING: 'Image url must be a string',
  IMAGE_URL_MUST_BE_FROM_1_TO_400: 'Image url length must be from 1 to 400',
  UPDATE_ME_SUCCESS: 'Update my profile success',
  FOLLOW_SUCCESS: 'Follow success',
  INVALID_USER_ID: 'Invalid user id',
  FOLLOWED_BEFORE: 'Followed before',
  CANNOT_FOLLOW_YOURSELF: 'Cannot follow yourself',
  ALREADY_UNFOLLOWED: 'Already unfollowed',
  UNFOLLOW_SUCCESS: 'Unfollow success',
  USERNAME_IS_INVALID:
    'Username is invalid - Username must be 4-15 characters long and can only contain letters, numbers, underscores, not only numbers',
  USERNAME_ALREADY_EXISTS: 'Username already exists',
  OLD_PASSWORD_IS_INCORRECT: 'Old password is incorrect',
  CHANGE_PASSWORD_SUCCESS: 'Change password success',
  GMAIL_NOT_VERIFIED: 'Gmail not verified',
  UPLOAD_SUCCESS: 'Upload success',
  REFRESH_TOKEN_SUCCESS: 'Refresh token success',
  GET_VIDEO_STATUS_SUCCESS: 'Get video status success',
} as const

export const TWEET_MESSAGES = {
  INVALID_TYPE: 'Invalid type',
  INVALID_AUDIENCE: 'Invalid audience',
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'Parent id must be a valid tweet id',
  PARENT_ID_MUST_BE_NULL: 'Parent id must be null',
  CONTENT_MUST_BE_A_STRING: 'Content must be a string',
  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non-empty string',
  CONTENT_MUST_BE_A_EMPTY_STRING: 'Content must be a empty string',
  HASHTAGS_MUST_BE_AN_ARRAY: 'Hashtags must be an array',
  HASHTAGS_MUST_BE_STRING_ARRAY: 'Hashtags must be string array',
  MENTIONS_MUST_BE_USER_ID_ARRAY: 'Mentions must be user id array',
  MEDIA_MUST_BE_AN_ARRAY: 'Media must be an array',
  MEDIA_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT: 'Media must be an array of media object',
} as const