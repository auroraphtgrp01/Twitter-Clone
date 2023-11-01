import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
import { validate } from '~/utils/validation'
const usersRoutes = Router()

usersRoutes.post('/login', loginValidator, loginController)

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

export default usersRoutes
