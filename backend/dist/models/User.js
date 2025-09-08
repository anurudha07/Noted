import { Schema, model, Document } from "mongoose";
const userSchema = new Schema({
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
export const User = model("User", userSchema);
//# sourceMappingURL=User.js.map