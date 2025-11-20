const rateLimit = require('express-rate-limit')
const { RateLimiterMemory } = require("rate-limiter-flexible")

const rateLimiter = new RateLimiterMemory({
  points: 1,
  duration: 3,
})

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 3, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
})

const signupLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 3, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
})

module.exports = { loginLimiter, signupLimiter, rateLimiter };