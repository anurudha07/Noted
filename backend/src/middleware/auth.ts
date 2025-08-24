import type{Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

const jwt_secret=process.env.JWT_SECRET || 'secret'
export interface AuthRequest extends Request{
    userId?:string;
}
export const authMiddleware=(req: AuthRequest, res: Response, next: NextFunction)=>{
    const header=req.headers.authorization;
    if(!header)
        return res.status(401).json({message: 'No token provided'})
    const token=header.split(' ')[1]
    if(!token)
        return res.status(401).json({message: 'Invalid token format'})

    try {
        const payload=jwt.verify(token,jwt_secret) as {userId: string};
        req.userId=payload.userId;
        next()
    } catch (error) {
        return res.status(401).json({message:'Invalid token'})
    }
}
