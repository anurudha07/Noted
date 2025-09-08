import { Schema, model, Document, Types } from 'mongoose';
const noteSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        default: '',
    },
    content: {
        type: String,
        default: '',
    },
    color: {
        type: String,
        default: '#111827',
    },
    pinned: {
        type: Boolean,
        default: false,
    },
    reminder: {
        at: { type: Date },
        sent: { type: Boolean, default: false },
        jobId: { type: String },
    },
}, { timestamps: true });
export const Note = model('Note', noteSchema);
//# sourceMappingURL=Note.js.map