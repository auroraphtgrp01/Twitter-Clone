import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import { accessTokenValidator, loginValidator, refreshTokenValidator, registerValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
const usersRoutes = Router()

/**
 * Description. Login a new user
 * Path: /login
 * Method: POST
 * Body: {  email: string,  password: string}
 */
usersRoutes.post('/login', loginValidator, wrapAsync(loginController))
/**
 * Description. Register a new user
 * Path: /register
 * Method: POST
 * Body: {
 * name: string,
 * email: string,
 * password: string,
 * confirm_password: string,
 * date_of_birth: ISO8601
 * }
 */
usersRoutes.post('/register', registerValidator, wrapAsync(registerController))
/**
 * Description. Logout a new user
 * Path: /logout
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {Refresh Token: string}
 */
usersRoutes.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))
export default usersRoutes
