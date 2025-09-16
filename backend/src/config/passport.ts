import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Profile, VerifyCallback } from "passport-google-oauth20";
import { User } from "../models/User.js";

const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:4000";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${backendOrigin}/api/auth/google/callback`,
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase() ?? "";

        // Find by googleId OR by the email address returned by Google
        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            ...(email ? [{ email }] : []),
          ],
        });

        if (user) {
          // If user exists but doesn't have googleId, link it
          if (!user.googleId) {
            const emailVerified = (profile.emails?.[0] as any)?.verified;
             if (emailVerified !== true) return done(new Error('Google email not verified'), undefined);

            user.googleId = profile.id;
            if (!user.name && profile.displayName) user.name = profile.displayName;
            await user.save();
          }
          return done(null, user);
        }

        // no user found -> create a fresh one
        const newUser = await User.create({
          googleId: profile.id,
          email,
          name: profile.displayName,
        });

        return done(null, newUser);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err as Error, undefined);
  }
});

export default passport;
