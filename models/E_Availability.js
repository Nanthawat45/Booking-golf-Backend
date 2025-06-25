import mongoose from "mongoose";

const equipmentAvailabilitySchema = new mongoose.Schema({
  date: { 
    type: String, 
    required: true 
  }, // เช่น '2025-06-25'

  type: { 
    type: String, 
    enum: ['golfCart', 'golfBag'], 
    required: true 
  },

  total: { 
    type: Number, 
    required: true 
  },

  available: { 
    type: Number, 
    default: 0 
  },

  booked: { 
    type: Number, 
    default: 0 
  },

  inUse: { 
    type: Number, 
    default: 0 
  },

  charging: { // สำหรับ golfCart = charging, golfBag = cleaning
    type: Number, 
    default: 0 
  },

  reserved: { 
    type: Number, 
    default: 0 
  },

  broken: { 
    type: Number, 
    default: 0 
  },
});

// สร้าง unique index ให้ date + type ไม่ซ้ำกัน
equipmentAvailabilitySchema.index({ date: 1, type: 1 }, { unique: true });

export default mongoose.model("EquipmentAvailability", equipmentAvailabilitySchema);
