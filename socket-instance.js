
const express = require('express')
const { createServer } = require("http")
const { Server } = require('socket.io');
const cors = require("cors")

const app = express();
const server = createServer(app);

const corsOrigin = process.env.NODE_ENV === 'dev'
  ? process.env.DEV_CORS_ORIGIN
  : process.env.PROD_CORS_ORIGIN

app.use(cors());

const io = new Server(server, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  cors: {
    origin: corsOrigin
  },
});

module.exports = { app, io, server };