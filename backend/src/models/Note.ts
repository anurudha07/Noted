import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    title: string;
    content: string;
    color?: string;
    pinned?: boolean;
    createdAt: Date;
    updatedAt: Date;
    reminder?: {
        at?: Date;
        sent?: boolean;
        jobId?: string;
    };
}

const noteSchema = new Schema<INote>({
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

}, { timestamps: true })
export const Note = model<INote>('Note', noteSchema)