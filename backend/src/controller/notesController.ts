import { Note } from '../models/Note.js';
import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { addReminderJob, removeReminderJob } from '../queues/reminderQueue.js';
import { User } from '../models/User.js';

// getAllNotes
export const getAllNotes = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await Note.find({
      user: req.userId,
      deleted: { $ne: true }   // <- IMPORTANT: exclude trashed notes
    }).sort({ 'reminder.sent': 1, updatedAt: -1 });

    res.json(notes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Create note
export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    const note = new Note({ user: req.userId, title, content });
    await note.save();
    res.json(note);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update note (keeps reminder as-is; use setReminder endpoint to change reminder)
export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await Note.findOneAndUpdate({ _id: id, user: req.userId }, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Note not found' });
    res.json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// soft-delete endpoint (DELETE /api/notes/:id)
export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = await Note.findOneAndUpdate(
      { _id: id, user: req.userId },
      { $set: { deleted: true, deletedAt: new Date() } },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note moved to trash', note });
  } catch (error) {
    console.log('deleteNote error', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Set reminder endpoint — schedules a BullMQ job
export const setReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { at } = req.body; 
    if (!at) return res.status(400).json({ message: 'Reminder time (at) required' });

    const atDate = new Date(at);
    if (Number.isNaN(atDate.getTime())) return res.status(400).json({ message: 'Invalid date' });

    const delay = atDate.getTime() - Date.now();
    if (delay <= 0) return res.status(400).json({ message: 'Reminder time must be in the future' });

    const note = await Note.findOne({ _id: id, user: req.userId });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const user = await User.findById(req.userId);
    if (!user || !user.email) return res.status(400).json({ message: 'User email not found' });

    // if an old job exists, remove it
    if (note.reminder?.jobId) {
      await removeReminderJob(note.reminder.jobId);
    }

    const jobId = `reminder-${note._id.toString()}-${Date.now()}`;
    await addReminderJob(jobId, {
      noteId: note._id.toString(),
      userId: req.userId,
      email: user.email,
      title: note.title,
      content: note.content,
    }, delay);

    note.reminder = { at: atDate, sent: false, jobId };
    await note.save();

    res.json({ message: 'Reminder scheduled', at: atDate.toISOString(), jobId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reminders
export const getAllReminders = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await Note.find({
      user: req.userId,
      'reminder.at': { $exists: true }
    }).sort({ 'reminder.at': 1 });

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dismiss reminders
export const dismissReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = await Note.findOneAndUpdate(
      { _id: id, user: req.userId },
      { 'reminder.sent': true },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Reminder dismissed', note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// moveToTrash (POST /api/notes/:id/trash) - same idea
export const moveToTrash = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log('moveToTrash called', { id, userId: req.userId });
    const note = await Note.findOneAndUpdate(
      { _id: id, user: req.userId },
      { $set: { deleted: true, deletedAt: new Date() } },
      { new: true }
    );
    if (!note) {
      console.log('moveToTrash: not found', { id, userId: req.userId });
      return res.status(404).json({ message: 'Note not found' });
    }
    console.log('moveToTrash: updated note', { id: note._id.toString(), deleted: note.deleted });
    res.json({ message: 'Note moved to trash', note });
  } catch (err) {
    console.error('moveToTrash error', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// Get trash
export const getTrash = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const notes = await Note.find({
      user: req.userId,
      deleted: true
    })
    .sort({ deletedAt: -1 })
    .skip((+page - 1) * +pageSize)
    .limit(+pageSize);

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Restore note
export const restoreNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = await Note.findOneAndUpdate(
      { _id: id, user: req.userId, deleted: true },
      { deleted: false, deletedAt: null },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note restored', note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Permanent delete
export const permanentDelete = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = await Note.findOneAndDelete({ _id: id, user: req.userId, deleted: true });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note permanently deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Empty trash
export const emptyTrash = async (req: AuthRequest, res: Response) => {
  try {
    await Note.deleteMany({ user: req.userId, deleted: true });
    res.json({ message: 'Trash emptied' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
