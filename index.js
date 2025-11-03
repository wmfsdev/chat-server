
require('dotenv').config();
require('./connection')

const { app, io, server } = require('./socket-instance');
const express = require('express')
const accountRouter = require('./routes/login');

app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  return next();
});

app.use("/", accountRouter);

app.use((err, req, res, next) => {
  console.log("express err handler")
  console.error(err);
  res.status(500).send(err);
});

server.listen(process.env.PORT, () => {
  console.log("server running");
});
