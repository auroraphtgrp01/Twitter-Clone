import { Router } from 'express'
import { getConversationController } from '~/controllers/Conversation.controller'
import { paginationValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, getConversationValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const conversationRouter = Router()

conversationRouter.get(
  '/receiver/:receiverId',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  wrapRequestHandler(getConversationController)
)

export default conversationRouter
