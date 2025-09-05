const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('../config/passport');
const prisma = require('../prisma/client');

const accountRouter = express.Router();

accountRouter.get("/test", async (req, res, next) => {
  // basic endpoint for checking who is online
  console.log("testing get")

  const sockets = await req.io.of('/profile').fetchSockets();  console.log("start looping sockets")
  for ( const socket of sockets) {
  
    console.log(socket.id)
  }
  console.log("end looping sockets")
//  console.log("sockets: ", sockets[0].id)
  res.status(200).json()
})

accountRouter.get("/some", async (req, res, next) => {

  console.log("/some route")
  
  try {
    passport.authenticate('jwt', async (err, user, info) => {
      if (!user) {
        return res.status(401).json({ message: 'not authorised' });
      }
      console.log("passport user: ", user)
      // const userId = user.id;
     
      return res.status(200).json({ username: user.username });
    })(req, res, next);
    } catch (error) {
      const status = error.statusCode;
      res.status(status).json(error.data);
    }

  // fetch request triggers token authentication
  // retrieve username at same time
})

accountRouter.post("/login", (req, res, next) => {
  console.log("POST Login");
  // if successful 200 response - makes client redirect
  // to "profile page" maybe with socket id?
  try {
    passport.authenticate('local', (err, user, info) => {
      console.log(user)
      if (err) { return next(err) }
      if (!user) {
        return res.status(401).json()
      }
      if (user) {
        const payloadObj = {
          id: user.id,
          username: user.username
        }
        const token = jwt.sign(
          payloadObj, 
          process.env.SECRET, 
          { algorithm: 'HS256', expiresIn: '1800000' }
        );
        res.status(200).json({ token })
      }
    })(req, res, next)
  } catch (error) {
    const status = error.statusCode;
    res.status(status).json(error.data);
  }
});

accountRouter.post('/signup', async (req, res, next) => {
  console.log("POST Signup")
  const { username } = req.body;
  const { password } = req.body;
  const hashpwd = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        hashpwd,
      },
    });
    const payloadObj = {
      id: user.id,
      username: user.username,
     // role: user.role,
    };

    const token = jwt.sign(
      payloadObj, 
      process.env.SECRET, 
      { algorithm: 'HS256', expiresIn: '1800000' }
    );
    res.status(200).json({ token });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(422).json([{ msg: 'Username already taken' }]);
    }
  }

})

module.exports = accountRouter;