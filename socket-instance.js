
const express = require('express')
const { createServer } = require("http")
const { Server } = require('socket.io');
const cors = require("cors")

const app = express();
const server = createServer(app);

app.use(cors());

const io = new Server(server, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  cors: {
    origin: "http://localhost:5173",
  },
});

module.exports = { app, io, server };