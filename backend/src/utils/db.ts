import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


const MONGO_URI = process.env.MONGO_URI || 'ongodb+srv://dbSarkar:Anurudha_2003@cluster0.j593o27.mongodb.net/Noted?retryWrites=true&w=majority&appName=Cluster0'


export const connectDB=async()=> {
await mongoose.connect(MONGO_URI).then(()=>console.log('MongoDB connected')).catch((error)=>console.log(`Database connection error... ${error}`))

}