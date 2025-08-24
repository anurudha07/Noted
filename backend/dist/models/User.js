import { Schema, model, Document } from "mongoose";
const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});
export const User = model('User', userSchema);
//# sourceMappingURL=User.js.map