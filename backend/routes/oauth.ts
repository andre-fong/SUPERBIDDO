import express from "express";
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
export const router = express.Router();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3001/api/v1/oauth/callback'
}, (accessToken, refreshToken, profile, done) => {
    // Here you would find or create a user in your database
    console.log(profile);
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user); // Store user ID in the session
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

router.get('/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect('http://localhost:3000/');
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));