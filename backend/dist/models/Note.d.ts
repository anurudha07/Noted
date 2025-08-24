import { Document, Types } from 'mongoose';
export interface INote extends Document {
    user: Types.ObjectId;
    title: string;
    content: string;
    color?: string;
    pinned?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Note: import("mongoose").Model<INote, {}, {}, {}, Document<unknown, {}, INote, {}, {}> & INote & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Note.d.ts.map