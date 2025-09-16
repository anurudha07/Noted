import express from 'express'
import {
    createNote, deleteNote, getAllNotes, setReminder, updateNote,
    getAllReminders, dismissReminder, moveToTrash, getTrash,
    restoreNote, permanentDelete, emptyTrash
} from '../controller/notesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.route('/')
    .get(authMiddleware, getAllNotes)
    .post(authMiddleware, createNote);

router.route('/:id')
    .put(authMiddleware, updateNote)
    .delete(authMiddleware, deleteNote);

router.route('/:id/reminder')
    .post(authMiddleware, setReminder);

router.route('/:id/reminder/dismiss')
    .post(authMiddleware, dismissReminder);

router.route('/reminders')
    .get(authMiddleware, getAllReminders);

router.route('/:id/trash')
    .post(authMiddleware, moveToTrash);

router.route('/trash')
    .get(authMiddleware, getTrash);

router.route('/:id/restore')
    .post(authMiddleware, restoreNote);

router.route('/:id/permanent')
    .delete(authMiddleware, permanentDelete);

router.route('/trash/empty')
    .post(authMiddleware, emptyTrash);

export default router