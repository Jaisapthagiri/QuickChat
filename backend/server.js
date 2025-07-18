import express from 'express'
import cors from 'cors'
import http from 'http'
import { connectDB } from './libs/db.js'
import userRouter from './routes/userRoute.js'
import messageRouter from './routes/messageRoutes.js'
import { Server } from 'socket.io'
import { userSocketMap, setIO } from './socketStore.js'
import 'dotenv/config'

const app = express()
const server = http.createServer(app)

export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

setIO(io)

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId
  console.log('User Connected:', userId)

  if (userId) userSocketMap[userId] = socket.id

  io.emit('getConnection', Object.keys(userSocketMap))

  socket.on('disconnect', () => {
    console.log('User Disconnected:', userId)
    delete userSocketMap[userId]
    io.emit('getConnection', Object.keys(userSocketMap))
  })
})

// Middleware
app.use(express.json({ limit: '4mb' }))
app.use(cors())

// Routes
app.use('/api/status', (req, res) => res.send('server is live'))
app.use('/api/auth', userRouter)
app.use('/api/messages', messageRouter)

// Connect DB and start server
await connectDB()

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log('server is running on Port', PORT)
})
