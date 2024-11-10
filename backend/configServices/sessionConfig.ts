import session from "express-session";
import { pool } from "./dbConfig.js";
import pgSession from "connect-pg-simple";
import * as dotenv from "dotenv";

// load dev environment variables
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: "../.env.development" });
}

const store = new (pgSession(session))({
  pool: pool,
});

// configure session data
declare module "express-session" {
  interface SessionData {
    accountUid?: string;
  }
}

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  store: store,
  resave: false,
  rolling: true,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // TODO: lax for development only
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
    secure: process.env.NODE_ENV === "development" ? false : true,
    // partitioned: true,
    maxAge: 1000 * 60 * 60 * 24, //24 hours, reset on activity
  },
});
