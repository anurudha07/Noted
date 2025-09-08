import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();
const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:4000";
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${backendOrigin}/api/auth/google/callback`,
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        console.log("GoogleStrategy: profile.id=", profile.id);
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.create({
                googleId: profile.id,
                email: profile.emails?.[0]?.value || "",
                name: profile.displayName,
            });
        }
        return done(null, user);
    }
    catch (err) {
        return done(err, undefined);
    }
}));
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        if (!user)
            return done(null, false);
        return done(null, user);
    }
    catch (err) {
        return done(err, undefined);
    }
});
export default passport;
//# sourceMappingURL=passport.js.map