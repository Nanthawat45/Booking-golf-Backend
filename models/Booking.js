import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { // โมเดล Userโดยเก็บ _id ของผู้ใช้
    type: mongoose.Schema.Types.ObjectId, // ใช้ ObjectId เพื่อเชื่อมโยงกับ User
    ref: 'User',  // อ้างอิงถึง User Model
    required: true  // ฟิลด์นี้จำเป็นต้องมี ในการบันทึกข้อมูล (ห้ามว่าง)
  },
  courseType: { type: String, enum: ["9", "18"], required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  players: { type: Number, min: 1, max: 4, required: true },
  groupName: { type: String, required: true },
  caddy: [{ 
      type: mongoose.Schema.ObjectId, // ใช้ ObjectId เพื่อเชื่อมโยงกับ User
      ref: "User", 
    }],
  totalPrice: { type: Number, required: true },
  isPaid: { type: Boolean, //เก็บค่าประเภท จริง/เท็จ (true/false)
    default: false //ค่าเริ่มต้นเป็น false
  },
  status: { 
        type: String, 
        enum: ['pending', 'onGoing', 'completed', 'canceled'], // กำหนดสถานะที่สามารถเป็นไปได้
        default: 'pending', // สถานะเริ่มต้นเมื่อสร้างการจอง
        required: true // ฟิลด์นี้จำเป็นต้องมี
    },
  golfCartQty: { type: Number, default: 0 }, 
  golfBagQty: { type: Number, default: 0 }, 
  
  // ฟิลด์สำหรับเก็บ ID ของ Asset ที่ถูกจอง
  bookedGolfCartIds: [{  // เก็บ ID ของ Golf Cart ที่ถูกจอง (One-Way Reference)
    type: mongoose.Schema.Types.ObjectId, // ใช้ ObjectId เพื่อเชื่อมโยงกับ Asset
    ref: 'Asset' // อ้างอิงถึง Asset Model
  }], 
  bookedGolfBagIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Asset' // อ้างอิงถึง Asset Model
  }],
}, { timestamps: true }); //เพิ่ม field อัตโนมัติ 2 ฟิลด์ใน ว่าสร้างวันไหนและอัปเดตวันไหน

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;