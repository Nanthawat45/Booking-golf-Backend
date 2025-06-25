import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseType: { type: String, enum: ["9", "18"], required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    players: { type: Number, min: 1, max: 4, required: true },
    groupName: { type: String, required: true },
    caddy: { type: [String] },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
