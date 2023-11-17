import { Router } from 'express'
import {
  uploadImageController,
  uploadVideoController,
  uploadVideoHLSController
} from '~/controllers/medias.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const mediasRoutes = Router()

mediasRoutes.post('/upload-img', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(uploadImageController))
mediasRoutes.post(
  '/upload-video',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoController)
)
mediasRoutes.post(
  '/upload-video-hls',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoHLSController)
)

export default mediasRoutes
