import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './utils/db.js';
import authRoutes from './routes/auth.js'
import notesRoutes from './routes/notes.js'
dotenv.config();
const app=express();
const PORT=process.env.PORT || 4000
app.use(express.json())
app.use(cors({
    origin:process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
}))
app.use('/api/auth',authRoutes)
app.use('/api/notes',notesRoutes)
connectDB()
.then(()=>{
    app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`)
    })
    
})