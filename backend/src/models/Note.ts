// server/models/Note.ts
import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  content: string;
  color?: string;
  pinned?: boolean;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reminder?: {
    at?: Date;
    sent?: boolean;
    jobId?: string;
  };
}

const noteSchema = new Schema<INote>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  color: { type: String, default: '#111827' },
  pinned: { type: Boolean, default: false },

  // <-- NEW fields for soft delete
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },

  reminder: {
    at: { type: Date },
    sent: { type: Boolean, default: false },
    jobId: { type: String },
  },
}, { timestamps: true });

// avoid model overwrite in hot reload/dev
export const Note = (mongoose.models?.Note as mongoose.Model<INote>) || model<INote>('Note', noteSchema);
