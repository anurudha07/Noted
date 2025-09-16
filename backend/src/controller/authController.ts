// server/controller/authController.ts
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";

dotenv.config();

const validateEmail = (email: string) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

const validatePassword = (password: string) => {
  // Min 8 chars, at least one letter, one number, one special char
  const re =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

// ----------------- REGISTER -----------------
export const registerController = async (req: Request, res: Response) => {
  try {
    let { name, email, password } = req.body;

    // normalize input
    name = String(name || "").trim();
    email = String(email || "").trim().toLowerCase();
    password = String(password || "").trim();

    // required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and include a letter, number, and special character",
      });
    }

    // check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // hash password
    const hash = await bcrypt.hash(password, 10);

    // create user
    const user = new User({ name, email, password: hash });
    await user.save();

    // sign JWT
    const jwt_secret = process.env.JWT_SECRET as string;
    if (!jwt_secret) throw new Error("JWT_SECRET is missing...");

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name },
      jwt_secret,
      { expiresIn: "2d" }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("registerController error", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ----------------- LOGIN -----------------
export const loginController = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          "This account was created with Google. Please sign in with Google.",
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const jwt_secret = process.env.JWT_SECRET as string;
    if (!jwt_secret) throw new Error("JWT_SECRET is missing...");

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name },
      jwt_secret,
      { expiresIn: "2d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.log("loginController error", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ----------------- GOOGLE OAUTH CALLBACK -----------------
export const googleCallbackHandler = async (req: any, res: Response) => {
  const frontend = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

  if (!req.user) {
    console.error("googleHandler: req.user is missing");
    return res.redirect(`${frontend}/login?error=oauth`);
  }

  try {
    const googleId = req.user.id ?? req.user._id;
    const email =
      (
        req.user.email ||
        (req.user.emails && req.user.emails[0]?.value) ||
        ""
      )
        .toLowerCase()
        .trim();
    const name =
      req.user.displayName ||
      req.user.name ||
      req.user.username ||
      req.user.given_name ||
      "Unnamed User";

    let user = null;
    if (googleId) user = await User.findOne({ googleId });
    if (!user && email) user = await User.findOne({ email });

    if (!user) {
      user = new User({ googleId, email, name });
      await user.save();
    } else {
      let changed = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if ((!user.name || user.name !== name) && name) {
        user.name = name;
        changed = true;
      }
      if (changed) await user.save();
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    };
    const jwt_secret = process.env.JWT_SECRET as string;
    if (!jwt_secret) throw new Error("JWT_SECRET is missing...");

    const token = jwt.sign(payload, jwt_secret, { expiresIn: "7d" });
    return res.redirect(`${frontend}/google-callback?token=${token}`);
  } catch (err) {
    console.error("googleHandler error:", err);
    return res.redirect(`${frontend}/login?error=oauth`);
  }
};

// ----------------- ME -----------------
export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.userId).select("name email");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("me error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
