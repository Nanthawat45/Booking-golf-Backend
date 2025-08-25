import mongoose from "mongoose";

const caddySchema = mongoose.Schema({
    name: { type: String, required: true },
    // Caddy จะยังคงมีข้อมูลพื้นฐานของ User
    caddy_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // แต่ละ User จะเป็น Caddy ได้แค่ครั้งเดียว
    },
    // เพิ่มข้อมูลเฉพาะของ Caddy
    caddyStatus: {
        type: String,
        enum: ['available', 'booked', 'onDuty', 'offDuty', 'resting', 'unavailable'],
        default: 'available',
    },
}, { timestamps: true });

const Caddy = mongoose.model("Caddy", caddySchema);
export default Caddy;