import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
  {
    name: {type: String, required: true, unique: true, enum: ["golfCart", "golfBag"],
    },
    total: {type: Number, required: true, min: 0,
    },
    available: {type: Number, required: true, min: 0,
    },
  },
  { timestamps: true }
);

const Equipment = mongoose.model("Equipment", equipmentSchema);
export default Equipment;
