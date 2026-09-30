import "dotenv/config";
import session from "express-session";
import { RedisStore } from "connect-redis";
import redisClient from "./redis.js";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing");
}

const sessionMiddleware = session({
  store: new RedisStore({
    client: redisClient,
    prefix: "support:session:",
  }),

  secret: process.env.SESSION_SECRET,
  name: "support.sid",

  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60,
  },
});

export default sessionMiddleware;