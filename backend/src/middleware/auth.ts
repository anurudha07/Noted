// server/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const jwt_secret = process.env.JWT_SECRET;
if (!jwt_secret) {
  console.error('JWT_SECRET is not set. Auth middleware will not work.');
}

export interface AuthRequest extends Request {
  userId?: string;
  tokenPayload?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'No token provided' });
  const parts = header.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'Invalid token format' });
  const token = parts[1];
  if (!token) return res.status(401).json({ message: 'Invalid token format' });
  if (!jwt_secret) return res.status(500).json({ message: 'Server JWT misconfiguration' });

  try {
    const payload = jwt.verify(token, jwt_secret) as any;
    req.userId = payload.userId || payload.id || payload.sub;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
