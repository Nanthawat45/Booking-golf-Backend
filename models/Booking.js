import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseType: { type: String, enum: ["9", "18"], required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  players: { type: Number, min: 1, max: 4, required: true },
  groupName: { type: String, required: true },
  caddy: [{ 
      type: mongoose.Schema.ObjectId, 
      ref: "User", 
    }],
  totalPrice: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  golfCartQty: { type: Number, default: 0 }, 
  golfBagQty: { type: Number, default: 0 }, 
  
  // ✅ ฟิลด์สำหรับเก็บ ID ของ Asset ที่ถูกจอง
  bookedGolfCartIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Asset' // อ้างอิงถึง Asset Model
  }], 
  bookedGolfBagIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Asset' // อ้างอิงถึง Asset Model
  }],
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;