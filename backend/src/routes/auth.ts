import express from "express";
import { googleCallbackHandler, loginController, registerController } from "../controller/authController.js";
import passport from "passport";


const router = express.Router();

router.route("/register").post(registerController);
router.route("/login").post(loginController);

router.route("/google").get(passport.authenticate("google", { scope: ["profile", "email"] }));

router.route("/google/callback").get(passport.authenticate("google", { session: false, failureRedirect:`${process.env.FRONTEND_ORIGIN}}/login` }),googleCallbackHandler);

export default router;
