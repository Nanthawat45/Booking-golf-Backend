import mongoose from "mongoose";

const ASSET_STATUS_ENUM = [
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

const assetSchema = new mongoose.Schema({
   assetId: {
        type: String,
        required: true,
        unique: true, // รหัสต้องไม่ซ้ำกัน
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        // ใช้สำหรับบอกรายละเอียดของปัญหา หรือข้อมูลอื่นๆ
    },
    name: { 
        type: String,
        required: true, // ทำให้ name จำเป็นต้องมี
        trim: true,
        unique: true // ถ้า name ต้องไม่ซ้ำกัน
    },
  type: { 
    type: String, 
    enum: ASSET_TYPE_ENUM, // กำหนดประเภทของ Asset (golfCart, golfBag)
    required: true 
  },
  status: { 
    type: String, 
    enum: ASSET_STATUS_ENUM, // กำหนดสถานะของ Asset
    default: "available", // สถานะเริ่มต้น
    required: true
  }
}, { timestamps: true });

export default mongoose.model("Asset", assetSchema);