import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createAccount } from "./accounts";
import { findEmail } from "./session";
import bcrypt from "bcrypt";
export const router = express.Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      //TODO: change to deployed URL
      callbackURL: "http://localhost:3001/api/v1/oauth/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const accountRecord = await findEmail(profile.emails[0].value);
      if (!accountRecord) {
        //TODO: remove and add column
        const passhash = await bcrypt.hash("Password1234", 10);
        const createAccountRecord = await createAccount(
          profile.emails[0].value,
          passhash,
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
}));



passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

router.get(
  "/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/" }),
  (req, res) => {
    //TODO: redirect to deployed frontend
    res.redirect("http://localhost:3000/");
  }
);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
