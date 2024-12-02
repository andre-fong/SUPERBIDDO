import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createAccount } from "./accounts";
import { findEmail } from "./session";
import bcrypt from "bcrypt";
import { generateToken } from "../configServices/csrfConfig";
export const router = express.Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/v1/oauth/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      const accountRecord = await findEmail(profile.emails[0].value);
      if (!accountRecord) {
        const createAccountRecord = await createAccount(
          profile.emails[0].value,
          null,
          profile.displayName
        );
        const account: Account = {
          accountId: createAccountRecord.accountId,
          email: createAccountRecord.email,
          username: createAccountRecord.username,
        };
        return done(null, account);
      }

      const account: Account = {
        accountId: accountRecord.accountId,
        email: accountRecord.email,
        username: accountRecord.username,
      };

      return done(null, account);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

router.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL,
  }),
  (req, res) => {
    req.session.accountId = req.user.accountId;
    req.session.csrfToken = generateToken(req, res);
    res.redirect(process.env.FRONTEND_URL);
  }
);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
