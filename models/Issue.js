import mongoose from 'mongoose';

const IssueSchema = new mongoose.Schema({
    holeNumber: {
        type: Number,
        required: [true, 'Please provide the hole number.'],
        min: [1, 'Hole number must be at least 1.'],
        max: [18, 'Hole number cannot exceed 18.']
    },
    issueType: {
        type: String,
        required: [true, 'Please provide the issue type.'],
        enum: [
            'hole_closure_report',  // แคดดี้/สตาร์ทเตอร์แจ้งปิดหลุม
            'hole_fix_progress',    // สตาร์ทเตอร์แจ้งกำลังแก้ไขหลุม
            'hole_fix_resolved',    // สตาร์ทเตอร์แจ้งแก้ไขสำเร็จ (หลุมเปิด)
            'hole_open_report',     // แคดดี้/สตาร์ทเตอร์แจ้งเปิดหลุม (อาจจะเพื่อบันทึกสถานะปกติ)
            'golf_cart_issue',      // ปัญหารถกอล์ฟ (พักไว้ก่อน)
            'golf_bag_issue',       // ปัญหาถุงกอล์ฟ (พักไว้ก่อน)
            'send_golf_cart',       // สตาร์ทเตอร์ส่งรถกอล์ฟ (พักไว้ก่อน)
            'send_golf_bag'         // สตาร์ทเตอร์ส่งถุงกอล์ฟ (พักไว้ก่อน)
        ]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters.']
    },
    status: {
        type: String,
        enum: ['reported', 'in_progress', 'resolved', 'closed'], // closed อาจใช้สำหรับปัญหาเก่ามากๆ ที่ไม่เกี่ยวข้อง
        default: 'reported'
    },
    reportedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    reportedAt: {
        type: Date,
        default: Date.now
    },
    resolvedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    },
    personInCharge: { // สำหรับชื่อคน/ID คนที่ไปแก้ไข หรือนำส่ง
        type: String,
        trim: true
    },
    quantity: { // สำหรับจำนวนรถ/ถุงกอล์ฟเสีย (หากนำกลับมาใช้)
        type: Number
    }
}, {
    timestamps: true // เพิ่ม createdAt และ updatedAt โดยอัตโนมัติ
});

export default mongoose.model('Issue', IssueSchema);