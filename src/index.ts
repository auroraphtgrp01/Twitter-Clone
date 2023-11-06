import express from 'express'
import userRoutes from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'

const app = express()
const port = 4000

databaseService.connect()
app.use(express.json())
app.use('/user', userRoutes)
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
