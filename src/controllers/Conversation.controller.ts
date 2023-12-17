import { Request, Response, NextFunction } from 'express'
import { GetConversationParams } from '~/models/requests/Conversation.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import conversationService from '~/services/conversation.services'

export const getConversationController = async (req: Request<GetConversationParams, any, any, any>, res: Response) => {
  const receiver_id = req.params.receiverId
  const sender_id = (req.decoded_authorization as TokenPayload).user_id
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  console.log('sender_id', sender_id)
  console.log('receiver_id', receiver_id)
  const result = await conversationService.getConversation({ sender_id, receiver_id, limit, page })
  return res.json(result)
}
