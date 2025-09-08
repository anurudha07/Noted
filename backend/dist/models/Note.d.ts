import { Document, Types } from 'mongoose';
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
export declare const Note: import("mongoose").Model<INote, {}, {}, {}, Document<unknown, {}, INote, {}, {}> & INote & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Note.d.ts.map