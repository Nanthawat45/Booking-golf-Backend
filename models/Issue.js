import mongoose from 'mongoose';

const IssueSchema = new mongoose.Schema({
    holeNumber: {
        type: Number,required: true,min: 1,max: 18 
    },
    issueType: {
        type: String,
        required: true,
        enum: [ // กำหนดประเภทของปัญหาที่สามารถแจ้งได้ 
            'hole_closure_report',  // แคดดี้/สตาร์ทเตอร์แจ้งปิดหลุม
            'hole_fix_progress',    // สตาร์ทเตอร์แจ้งกำลังแก้ไขหลุม
            'hole_fix_resolved',    // สตาร์ทเตอร์แจ้งแก้ไขสำเร็จ (หลุมเปิด)
            'hole_open_report',     // แคดดี้/สตาร์ทเตอร์แจ้งเปิดหลุม
            'golf_cart_issue',      // ปัญหารถกอล์ฟเสีย
            'golf_bag_issue',       // ปัญหาถุงกอล์ฟเสีย
            'send_golf_cart',       // สตาร์ทเตอร์ส่งรถกอล์ฟ 
            'send_golf_bag'         // สตาร์ทเตอร์ส่งถุงกอล์ฟ
        ]
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500 // จำกัดความยาวของคำอธิบายไม่เกิน 500 ตัวอักษร
    },
    status: {
        type: String,
        enum: ['reported', 'in_progress', 'resolved', 'closed'], // closed อาจใช้สำหรับปัญหาเก่ามากๆ ที่ไม่เกี่ยวข้อง
        default: 'reported'
    },
    reportedBy: { // เก็บ ID ของผู้ที่รายงานปัญหา
        type: mongoose.Schema.ObjectId, // เพื่อเชื่อมโยงกับ User
        ref: 'User', // อ้างอิงถึง User Model
        required: true
    },
    reportedAt: {
        type: Date, // เก็บวันที่และเวลาที่รายงานปัญหา
        default: Date.now // ใช้วันที่ปัจจุบันเป็นค่าเริ่มต้น
    },
    resolvedBy: { // เก็บ ID ของผู้ที่แก้ไขปัญหา
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    resolvedAt: {   // เก็บวันที่และเวลาที่แก้ไขปัญหา
        type: Date
    },
    personInCharge: { // สำหรับชื่อคน/ID คนที่ไปแก้ไข
        type: String,
        trim: true
    },
    quantity: { // สำหรับจำนวนของปัญหาที่เกิดขึ้น เช่น จำนวนรถกอล์ฟที่เสีย
        type: Number
    }
}, {
    timestamps: true //เพิ่ม field อัตโนมัติ 2 ฟิลด์ใน ว่าสร้างวันไหนและอัปเดตวันไหน
});

export default mongoose.model('Issue', IssueSchema);