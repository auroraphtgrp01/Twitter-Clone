import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const mediasRoutes = Router()

mediasRoutes.post('/upload-img', wrapRequestHandler(uploadImageController))

export default mediasRoutes
