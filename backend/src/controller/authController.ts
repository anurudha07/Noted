import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { Request, Response } from "express";

dotenv.config();

export const registerController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists..." });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash });
    await user.save();

    const jwt_secret = process.env.JWT_SECRET as string;
    if (!jwt_secret) throw new Error("JWT_SECRET is missing...");

    const token = jwt.sign({ userId: user._id }, jwt_secret, {
      expiresIn: "2d",
    });

    res.json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }


    if (!user.password) {
      return res.status(400).json({
        message: "This account was created with Google. Please sign in with Google.",
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const jwt_secret = process.env.JWT_SECRET as string;
    if (!jwt_secret) throw new Error("JWT_SECRET is missing...");

    const token = jwt.sign({ userId: user._id }, jwt_secret, {
      expiresIn: "2d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const googleCallbackHandler = (req: any, res: Response) => {
  const frontend = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

  if (!req.user) {
    console.error("googleHandler: req.user is missing");
    return res.redirect(`${frontend}/login?error=oauth`);
  }

  try {
    const payload = { userId: req.user._id ?? req.user.id, email: req.user.email };
    const jwt_secret = process.env.JWT_SECRET as string;
    if (!jwt_secret) throw new Error("JWT_SECRET is missing...");

    const token = jwt.sign(payload, jwt_secret, { expiresIn: "7d" });
    return res.redirect(`${frontend}/google-callback?token=${token}`);
  } catch (err) {
    console.error("googleHandler error:", err);
    return res.redirect(`${frontend}/login?error=oauth`);
  }
};