import mongoose from "mongoose";

const ASSET_STATUS_ENUM = [ //กำหนดค่าอาเร ของสถานะ Asset ที่สามารถใช้ได้
  "booked", 
  "inUse", 
  "clean", 
  "available", 
  "spare", 
  "broken"
];

const ASSET_TYPE_ENUM = [
    "golfCart", 
    "golfBag"
];

const assetSchema = new mongoose.Schema({ //สรา้าง Schema สำหรับ Asset
   assetId: {
        type: String,
        required: true, //ฟิลด์นี้จำเป็นต้องมี
        unique: true, // รหัสต้องไม่ซ้ำกัน
        trim: true,
    },
    description: {
        type: String,
        trim: true, // ทำให้ข้อความไม่มีช่องว่างที่ไม่จำเป็น
    },
    name: { 
        type: String,
        required: true, // ทำให้ name จำเป็นต้องมี //required: trueจำเป็นค้องมีค่าเสมอ
        trim: true,
        unique: true // ถ้า name ต้องไม่ซ้ำกัน
    },
  type: { 
    type: String, 
    enum: ASSET_TYPE_ENUM, // กำหนดประเภทของ Asset ให้รับได้แค่(golfCart, golfBag)
    required: true 
  },
  status: { 
    type: String, 
    enum: ASSET_STATUS_ENUM, // กำหนดสถานะของ Asset
    default: "available", // สถานะเริ่มต้น
    required: true
  }
}, { timestamps: true }); //เพิ่ม field อัตโนมัติ 2 ฟิลด์ใน ว่าสร้างวันไหนและอัปเดตวันไหน

export default mongoose.model("Asset", assetSchema);