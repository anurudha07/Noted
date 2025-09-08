import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  email?: string;
  password?: string;
  googleId?: string;
  name?: string;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: false, 
  },
  password: {
    type: String,
    required: false, 
  },
  googleId: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
});

export const User = model<IUser>("User", userSchema);
