import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


const MONGO_URI = process.env.MONGO_URI || 'MONGO_URI'


export const connectDB=async()=> {
await mongoose.connect(MONGO_URI).then(()=>console.log('MongoDB connected')).catch((error)=>console.log(`Database connection error... ${error}`))

}