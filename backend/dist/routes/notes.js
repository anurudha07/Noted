import express from 'express';
import { createNote, deleteNote, getAllNotes, updateNote } from '../controller/notesController.js';
import { authMiddleware } from '../middleware/auth.js';
const router = express.Router();
router.route('/')
    .get(authMiddleware, getAllNotes)
    .post(authMiddleware, createNote);
router.route('/:id')
    .put(authMiddleware, updateNote)
    .delete(authMiddleware, deleteNote);
export default router;
//# sourceMappingURL=notes.js.map