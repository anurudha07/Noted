import {Schema, model, Document, Types} from 'mongoose';

export interface INote extends Document {
    user: Types.ObjectId,
    title: string,
    content: string,
    color?:string,
    pinned?:boolean,
    createdAt:Date,
    updatedAt: Date
}

const noteSchema=new Schema<INote>({
    user:{
        type: Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    title:{
        type: String,
        default:''
    },
    content:{
        type: String,
        default:'',

    },
    color: {
        type:String,
        default:'#111827'
    },
    pinned:{
        type: Boolean,
        deault: false
    },
    
},{timestamps:true})
export const Note=model<INote>('Note',noteSchema)