import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },// unique อีเมลต้องไม่ซ้ำกัน
    password: { type: String, required: true },
role: {
      type: String,
      enum: ['admin', 'user', 'caddy', 'starter'],
      default: 'user',
    },
    
  caddyStatus: { 
      type: String,
      enum: ['available', 'booked', 'onDuty', 'offDuty', 'resting', 'unavailable'], 
      default: 'available', // สถานะเริ่มต้นคือ 'available' (ว่าง)
    },
    // profileImage: {
    //   type: String, // เช่น เก็บเป็น URL หรือชื่อไฟล์
    //   default: '',  // หรือจะกำหนดเป็น default รูป placeholder ก็ได้
    // },
  },
  { timestamps: true } //เพิ่ม field อัตโนมัติ 2 ฟิลด์ใน ว่าสร้างวันไหนและอัปเดตวันไหน
);

const User = mongoose.model("User", userSchema);
export default User;