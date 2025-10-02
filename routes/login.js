const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('../config/passport');
const prisma = require('../prisma/client');
const { Prisma } = require('@prisma/client');

const accountRouter = express.Router();


accountRouter.post("/chat", async(req, res, next) => {
  console.log("retrieving chat history")
  const { room, author } = req.body
  
  const chat = await prisma.message.findMany({
    where: {
      OR: [
        {
          AND: [
            { authorId: author },
            { room: room }
          ]
        },
        {
          AND: [
            { authorId: room },
            { room: author }
          ]
        }
      ]
    },
    select: {
      id: true,
      content: true,
      author: {
        select: {
          username: true
        }
      }
    }
  })
  console.log(chat)
  res.status(200).json(chat)
})

accountRouter.get("/auth", async (req, res, next) => {
  console.log("/auth route")
  // if statement - check request is coming from chat frontend
  try {
    passport.authenticate('jwt', async (err, user, info) => {
      if (!user) {
        return res.status(401).json({ message: 'not authorised' });
      }
      return res.status(200).json({ username: user.username, id: user.id });
    })(req, res, next);
    } catch (error) {
      const status = error.statusCode;
      res.status(status).json(error.data);
    }
  // fetch request triggers token authentication
  // retrieve username at same time
})

accountRouter.post("/login", (req, res, next) => {
  // console.log("POST Login");
  try {
    passport.authenticate('local', (err, user, info) => {
      if (err) { return next(err) }
      if (!user) {
        return res.status(401).json({info})
      }
      if (user) {
        const payloadObj = {
          id: user.id,
          username: user.username,
          sessionId: user.sessionId,
        }
        const token = jwt.sign(
          payloadObj, 
          process.env.SECRET, 
          { algorithm: 'HS256', expiresIn: '180000000' }
        );
        res.status(200).json({ token })
      }
    })(req, res, next)
  } catch (error) {
    console.log("throw error")
    next(error)
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
      sessionId: user.sessionId,
    };
    const token = jwt.sign(
      payloadObj, 
      process.env.SECRET, 
      { algorithm: 'HS256', expiresIn: '180000000' }
    );
    res.status(200).json({ token });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(422).json([{ msg: 'Username already taken' }]);
      } else {
        return res.status(422).json([{ msg: 'Database request error' }])
      }
    } else {
      next(err)
    }
  }

})

module.exports = accountRouter;