import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
role: {
      type: String,
      enum: ['admin', 'user', 'caddy', 'starter'],
      default: 'user',
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;