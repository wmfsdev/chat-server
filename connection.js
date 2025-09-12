const { io } = require('./socket-instance')
const passport = require('passport')
require('./config/passport')
const jwt = require('jsonwebtoken')


const connect = io.of("/profile");

connect.use((socket, next) => {
  // token auth
  const token = socket.handshake.auth.token

  jwt.verify(token, process.env.SECRET, function(err, decoded) {
    if (err) {
      console.log("error: ", err)
      next(err)
    } else {
      console.log("decoded: ", decoded)
      socket.data.username = decoded.username
      socket.data.id = decoded.id
      next()
    }
  })
})


connect.on("connection", async (socket) => {
  console.log("connected", socket.id)

  const users = []
  const sockets = await connect.fetchSockets()
  
  for ( const socket of sockets) {
    users.push({
      socketID: socket.id,
      userID: socket.data.id,
      username: socket.data.username
    })
  }
  console.log("USERS: ", users)
  socket.emit("users", users)
  
  socket.broadcast.emit("user_connected", {
      socketID: socket.id,
      userID: socket.data.id,
      username: socket.data.username
  });

  // DISCONNECT
  socket.on("disconnecting", async () => {
    console.log(`user disconnecting...`)
    console.log(socket.data)
    console.log(socket.rooms)
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
  socket.on("send_priv_message", (data) => {
    console.log(data)
    socket.to(data.to).emit("receive_priv_message", { id: data.id, from: data.from, message: data.message })
  })
});



