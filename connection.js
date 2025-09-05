const { io } = require('./socket-instance')
const passport = require('passport')
require('./config/passport')
const jwt = require('jsonwebtoken')


const connect = io.of("/profile");

connect.use((socket, next) => {
  const token = socket.handshake.auth.token
  const decoded = jwt.verify(token, process.env.SECRET)
  socket.data.username = decoded.username
  next()
})


connect.on("connection", async (socket) => {
  console.log("connection", socket.id)

  const users = []
  const sockets = await connect.fetchSockets()
  
  for ( const socket of sockets) {
    users.push({
      userID: socket.id,
      username: socket.data.username
    })
  }

  socket.emit("users", users)

  socket.on("users", (socket) => {
  })

  // DISCONNECT
  socket.on("disconnect", (socket) => {
    console.log("disconnected")
  })

  // SET USER - redundant?
  // socket.on("set_user", (username) => {
  //   // pass in client supplied username from Profile
  //   console.log("set_user: ", username)
  //   socket.data.username = username
  // })

  // JOIN ROOM
  socket.on("join_room", (id, data) => {
    console.log("ROOM ID: ", id)
    console.log(`User ${data.username} joined room`)

    socket.to(id).emit("user_joined", data.username)
  })

  // SEND MESSAGE
  socket.on("send_message", async (data) => {
    console.log(data)

    socket.to(data.room).emit("receive_message", { content: data, from: socket.id })
  })
});