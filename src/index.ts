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
  socket.on('private_message', (data) => {
    const receive_socket_id = users[data.to]?.socket_id
    databaseService.conversation.insertOne(
      new Conversation({
        sender_id: new ObjectId(data.from),
        receiver_id: new ObjectId(data.to),
        content: data.content
      })
    )
    socket.to(receive_socket_id).emit('private_message_rec', {
      content: data.content,
      from: user_id
    })
  })
})

httpServer.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
