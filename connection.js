const { io } = require('./socket-instance')
const passport = require('passport')
require('./config/passport')
const jwt = require('jsonwebtoken')
const prisma = require('./prisma/client')
const zod = require("zod")
const { rateLimiter } = require("./config/rateLimitConfig")

const connect = io.of("/messages");

connect.use((socket, next) => {
  const token = socket.handshake.auth.token
  jwt.verify(token, process.env.SECRET, function(err, decoded) {
    if (err) {
      if (err.name === 'JsonWebTokenError') {
        err.message = 'Not Authorised'
        return next(err)
      } 
      if (err.name === 'TokenExpiredError') {
        err.message = 'Token Expired'
        return next(err)
      } else {
        err.message = 'Verification Error'
        next(err)
      }
    } else {
      socket.data.username = decoded.username
      socket.data.id = decoded.id
      next()
    }
  })
})

connect.on("connection", async (socket) => {
  console.log("connected", socket.id)
  if (socket.recovered) {
    console.log("socket recovered")
  }

  socket.join(socket.data.id)
  socket.join("public")
  
  socket.broadcast.emit("user_connected", {
    socketID: socket.id,
    userID: socket.data.id,
    username: socket.data.username
  });

  socket.on("req_users", async(data) => {
    const sockets = await connect.fetchSockets()
    const users = []
    const userCount = sockets.length

    for (const socket of sockets) {
      users.push({
        userID: socket.data.id,
        username: socket.data.username,
        sessionId: socket.data.sessionId,
      })
    }
    socket.emit("users", users, userCount) 
  })

  // DISCONNECT
  socket.on("disconnecting", async () => {
    console.log(`user disconnecting...`)
    const username = await socket.data.username
    socket.broadcast.emit("user_disconnected", {
      username: username
    })
  })

  // JOIN ROOM
  socket.on("join_room", (id, data) => {
    socket.to(id).emit("user_joined", data.username)
  })
  
  // SEND PUBLIC MESSAGE
  socket.on("send_public_message", async(data, callback) => {
    console.log("send_public_message")
    try {
      await rateLimiter.consume(data.userId)

      const User = zod.object({
        message: zod.string().min(1).max(500),
      })
      const result = User.safeParse({ message: data.message })

      if (!result.success) {
        callback({ status: "Bad Request"})
      } else {
        const message = await prisma.message.create({
          data: {
            content: data.message,
            room: data.room,
            authorId: data.userId
          }
        })
        console.log("message: ", message)
        const { id, content, timestamp } = message
        
        socket.to("public").emit("receive_public_message", {
          id: data.id,
          username: data.username,
          message: content,
          timestamp: timestamp
        })
        callback({ status: "Great" })
      }
    } catch(rejRes) {
      console.log("consumed: ", rejRes.consumedPoints)
      if (rejRes.consumedPoints > 40) {
        return callback({ status: "force_logout" })
      }
      callback({ status: "Message Limit", timeleft: Math.ceil(rejRes.msBeforeNext / 1000) })
    }
  })

  // SEND PRIVATE MESSAGE
  socket.on("send_priv_message", async(data, callback) => {
    try {
      await rateLimiter.consume(data.from.id)

      const User = zod.object({
        message: zod.string().min(1).max(500),
      })
      const result = User.safeParse({ message: data.message })

      if (!result.success) {
        callback({ status: "Bad Request" });
      } else {
        const message = await prisma.message.create({
          data: {
            content: data.message,
            room: data.to,
            authorId: data.from.id,
          }
        })
        callback({ status: "Great" })
        socket.to(data.to).emit("receive_priv_message", { 
          id: data.id,
          from: data.from,
          message: data.message,
          timestamp: message.timestamp
        })
      }
    } catch(rejRes) {
      console.log("consume IP")
      if (rejRes.consumedPoints > 40) {
        return callback({ status: "force_logout" })
      }
      callback({ status: "Message Limit", timeleft: Math.ceil(rejRes.msBeforeNext / 1000) })
    }
  })
});