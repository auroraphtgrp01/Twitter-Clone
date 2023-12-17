import express from 'express'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import cors from 'cors'
import { RouterApp } from './routes/index.routes'
import { createServer } from 'http'
import { Server } from 'socket.io'
// import 'src/utils/faker'
import './utils/s3'
import Conversation from './models/schemas/Conversation.schemas'
import { ObjectId } from 'mongodb'
config()
const app = express()
const port = process.env.PORT || 4000
const httpServer = createServer(app)

initFolder()
app.use(cors())
databaseService.connect().then(() => {
  databaseService.indexeUser()
  databaseService.indexRefreshToken()
  databaseService.indexVideoStatus()
  databaseService.indexFollowers()
  databaseService.indexTweet()
})
app.use(express.json())
RouterApp(app)
app.use(defaultErrorHandler)

// app.listen(port, () => {
//   console.log(`Listening on port ${port}`)
// })
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000'
  }
})
const users: {
  [key: string]: {
    socket_id: string
  }
} = {}
io.on('connection', (socket) => {
  console.log(`${socket.id} connected`)
  const user_id = socket.handshake.auth._id
  users[user_id] = {
    socket_id: socket.id
  }
  console.log('users', users)

  socket.on('disconnect', () => {
    delete users[user_id]
    console.log(`${socket.id} disconnected`)
  })
  socket.on('private_message', async (data) => {
    const { receiver_id, sender_id, content } = data.payload
    const receive_socket_id = users[receiver_id]?.socket_id
    const conversation = new Conversation({
      sender_id: new ObjectId(sender_id),
      receiver_id: new ObjectId(receiver_id),
      content: content
    })
    const result = await databaseService.conversation.insertOne(conversation)
    conversation._id = result.insertedId
    socket.to(receive_socket_id).emit('private_message_rec', {
      payload: conversation
    })
  })
})

httpServer.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
