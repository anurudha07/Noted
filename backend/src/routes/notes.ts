import express from 'express'
import { createNote, deleteNote, getAllNotes, setReminder, updateNote } from '../controller/notesController.js';
import { authMiddleware } from '../middleware/auth.js';
const router=express.Router();

router.route('/')
.get(authMiddleware,getAllNotes)
.post(authMiddleware,createNote);

router.route('/:id')
.put(authMiddleware,updateNote)
.delete(authMiddleware,deleteNote);

router.route('/:id/reminder').post(authMiddleware, setReminder);

export default router