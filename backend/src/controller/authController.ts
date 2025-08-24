import { User } from "../models/User.js";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import type {Request, Response} from 'express'

dotenv.config();
export const registerController=async(req:Request,res:Response)=>{
    try {
        const {email, password}=req.body;
        if(!email || !password)
            return res.status(400).json({success: false,
        message:'Email and password required'})
        const existing = await User.findOne({email})
        if(existing){
            return res.status(400).json({success:'false',
                message: ' User alread exists...'
            })
        }
        const hash=await bcrypt.hash(password,10);
        const user=new User({email,password:hash})
        await user.save()
        const jwt_secret=process.env.JWT_SECRET as string
        if(!jwt_secret)
            throw new Error('JWT_SECRET is missing...')
        const token=jwt.sign({userId:user._id},jwt_secret,{expiresIn:'2d'})
        res.json({
            token, user: {id: user._id, email: user.email}
        })


        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}


export const loginController=async(req:Request,res:Response)=>{
    try {
        const {email,password}=  req.body;
        if(!email || !password)
            return res.status(400).json({message: 'Email and password requred'})
        const user=await User.findOne({email})
        if(!user)
            return res.status(400).json({message: 'Invalid credentials'})
        const ok=await bcrypt.compare(password, user.password)
        if(!ok)
            return res.status(400).json({ message: 'Invalid credentials'})
        const jwt_secret=process.env.JWT_SECRET as string
        const token=jwt.sign({userId:user._id},jwt_secret,{expiresIn:'2d'})
        res.json({
            token,
            user:{
                id:user._id,
                email: user.email
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Server error'
        })
        
    }

}