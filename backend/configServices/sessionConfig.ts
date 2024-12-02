import session, { SessionOptions } from "express-session";
import { pool } from "./dbConfig.js";
import pgSession from "connect-pg-simple";

const store = new (pgSession(session))({
  pool: pool,
});

// configure session data
declare module "express-session" {
  interface SessionData {
    accountId?: string;
    csrfToken?: string;
  }
}

export const sessionConfig: SessionOptions = {
  secret: process.env.SESSION_SECRET,
  store: store,
  resave: false,
  rolling: true,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
    secure: process.env.NODE_ENV === "development" ? false : true,
    // partitioned: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours, reset on activity
  },
};
