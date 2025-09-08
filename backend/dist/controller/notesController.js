import { Note } from '../models/Note.js';
import { addReminderJob, removeReminderJob } from '../queues/reminderQueue.js';
import { User } from '../models/User.js';
// getAllNotes
export const getAllNotes = async (req, res) => {
    try {
        const notes = await Note.find({ user: req.userId }).sort({ 'reminder.sent': 1, updatedAt: -1 });
        res.json(notes);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Create note
export const createNote = async (req, res) => {
    try {
        const { title, content } = req.body;
        const note = new Note({ user: req.userId, title, content });
        await note.save();
        res.json(note);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Update note (keeps reminder as-is; use setReminder endpoint to change reminder)
export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Note.findOneAndUpdate({ _id: id, user: req.userId }, req.body, { new: true });
        if (!updated)
            return res.status(404).json({ message: 'Note not found' });
        res.json(updated);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Delete note — also remove scheduled job if exists
export const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findOneAndDelete({ _id: id, user: req.userId });
        if (!note)
            return res.status(404).json({ message: 'Note not found' });
        if (note.reminder?.jobId) {
            await removeReminderJob(note.reminder.jobId);
        }
        res.json({ message: 'Deleted' });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Set reminder endpoint — schedules a BullMQ job
export const setReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const { at } = req.body;
        if (!at)
            return res.status(400).json({ message: 'Reminder time (at) required' });
        const atDate = new Date(at);
        if (Number.isNaN(atDate.getTime()))
            return res.status(400).json({ message: 'Invalid date' });
        const delay = atDate.getTime() - Date.now();
        if (delay <= 0)
            return res.status(400).json({ message: 'Reminder time must be in the future' });
        const note = await Note.findOne({ _id: id, user: req.userId });
        if (!note)
            return res.status(404).json({ message: 'Note not found' });
        const user = await User.findById(req.userId);
        if (!user || !user.email)
            return res.status(400).json({ message: 'User email not found' });
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};
//# sourceMappingURL=notesController.js.map