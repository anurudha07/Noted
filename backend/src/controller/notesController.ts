
import { Note } from "../models/Note.js";
import type { Response } from 'express'
import type{AuthRequest} from '../middleware/auth.js'

// getAllNotes
export const getAllNotes = async (req: AuthRequest, res: Response) => {
    try {
        const notes = await Note.find({ user: req.userId }).sort({ pinned: -1, updatedAt: -1 })
        res.json(notes);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' })
    }
}

// Create note
export const createNote = async (req: AuthRequest, res: Response) => {
    try {
        const { title, content } = req.body;
        const note = new Note({ user: req.userId, title, content })
        await note.save()
        res.json(note);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Update note
export const updateNote = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updated = await Note.findByIdAndUpdate({ _id: id, user: req.userId }, req.body, { new: true })
        if (!updated)
            return res.status(404).json({ message: 'Note not found' })
        res.json(updated)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Delete note
export const deleteNote = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const removed = await Note.findOneAndDelete({_id: id, user: req.userId})
        if (!removed) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}