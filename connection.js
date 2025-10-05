const { io } = require('./socket-instance')
const passport = require('passport')
require('./config/passport')
const jwt = require('jsonwebtoken')
const prisma = require('./prisma/client')

const connect = io.of("/profile");

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
  
  socket.broadcast.emit("user_connected", {
    socketID: socket.id,
    userID: socket.data.id,
    username: socket.data.username
  });

  socket.on("req_users", async(data) => {
    console.log("client requested 'users'")
    const sockets = await connect.fetchSockets()
    const users = []

    for (const socket of sockets) {
      users.push({
        userID: socket.data.id,
        username: socket.data.username,
        sessionId: socket.data.sessionId,
      })
    }
    socket.emit("users", users) 
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
    console.log("ROOM ID: ", id)
    console.log(`User ${data.username} joined room`)

    socket.to(id).emit("user_joined", data.username)
  })

  // SEND PRIVATE MESSAGE
  socket.on("send_priv_message", async(data) => {
    const message = await prisma.message.create({
      data: {
        content: data.message,
        room: data.to,
        authorId: data.from.id,
      }
    })
    socket.to(data.to).emit("receive_priv_message", { id: data.id, from: data.from, message: data.message })
  })
});