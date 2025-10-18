const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('../config/passport');
const prisma = require('../prisma/client');
const { Prisma } = require('../generated/prisma')
const { body, validationResult } = require('express-validator')

const accountRouter = express.Router();

accountRouter.post("/chat", async(req, res, next) => {
  console.log("retrieving chat history")
  const { room, author } = req.body
  
  try {
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
  } catch(err) {
    console.log(err)
    next(err)
  }
})

accountRouter.get("/auth", async (req, res, next) => {
  console.log("/auth route")
  
  if (req.headers.origin !== process.env.CHAT_FRONTEND_URL) {
    const err = new Error('Unauthorised Origin')
    err.statusCode = 401
    return next(err)
  }
  
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
})

accountRouter.post("/login",
  [
  body('username')
    .notEmpty().withMessage('Username is required')
    .trim()
    .isLength({ min: 5, max: 18 })
    .withMessage('Username must be between 5 and 18 characters')
    .isAlphanumeric()
    .withMessage('May only contain alphanumeric characters'),
  body('password')
    .trim()
    .isLength({ min: 6, max: 25 })
    .withMessage('Must be between 6 and 25 characters'),
], (req, res, next) => {

  if (req.headers.origin !== process.env.CHAT_FRONTEND_URL) {
    const err = new Error('Unauthorised Origin')
    err.statusCode = 401
    return next(err)
  }

  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      const err = new Error('validation failed');
      err.statusCode = 422;
      err.data = errors.array();
      return res.status(err.statusCode).json(err.data)
    }

    passport.authenticate('local', (err, user, info) => {
      if (err) { return next(err) }
      if (!user) {
        return res.status(401).json({ info })
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
    console.log("catch error")
    next(error)
  }
});

accountRouter.post('/signup', 
  [
  body('username')
    .notEmpty().withMessage('Username is required')
    .trim()
    .isLength({ min: 5, max: 18 })
    .withMessage('Username must be between 5 and 18 characters')
    .isAlphanumeric()
    .withMessage('May only contain alphanumeric characters'),
  body('password')
    .trim()
    .isLength({ min: 6, max: 25 })
    .withMessage('Password must be between 6 and 25 characters'),
  body('confirm')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords must match'),
], async (req, res, next) => {
    console.log("POST Signup")

    const errors = validationResult(req)
    console.log("validation errors: ", errors)

    if (errors.isEmpty()) {

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
          { algorithm: 'HS256', expiresIn: '1800' }
        );
        res.status(200).json({ token });
      } catch (err) {
        console.log(err)
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

    } else {
      const err = new Error('validation')
      err.statusCode = 422
      err.data = errors.array()
      res.status(err.statusCode).json(err.data)
    }
})

module.exports = accountRouter;