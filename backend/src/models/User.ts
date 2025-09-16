import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;   // ✅ make required at TS-level too
  password?: string;
  googleId?: string;
  name: string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email format"], // ✅ regex validation at schema level
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId; // ✅ password required unless googleId exists
      },
    },
    googleId: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
