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
  // ไม่มีฟิลด์ 'name' แล้ว ใช้ _id ของ MongoDB เป็นตัวระบุเฉพาะ
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