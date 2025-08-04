import jwt from "jsonwebtoken";
import User from "../models/User.js";
// ข้อมูลอะไรใน JWT

// Middleware สำหรับตรวจสอบการยืนยันตัวตนของผู้ใช้
export const protect = async (req, res, next) => { //next คือฟังก์ชันที่เรียกใช้ต่อไป
  const token = req.cookies.jwt; // ดึง token จาก cookies ที่ส่งมาจาก client

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" }); // ถ้าไม่มี token ให้ส่งข้อความว่าไม่ได้รับอนุญาต
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ถอดรหัส token
    req.user = await User.findById(decoded.userId).select("-password"); // ค้นหาผู้ใช้จาก ID ที่ได้จาก token และ .select("-password") ไม่ส่งรหัสผ่านกลับไป
    next(); // ทำงานเสร็จแล้ว //ไปยัง Middleware หรือ Controller ถัดไป
  } catch (error) {
    console.error("Token verification failed:", error.message); // ข้อผิดพลาดในการตรวจสอบ token
    res.status(401).json({ message: "Not authorized, token failed" }); // ส่งข้อความว่าไม่ได้รับอนุญาตเนื่องจาก token ไม่ถูกต้อง
  }
};

export const authorizeRoles = (...roles) => {//...roles คือการรับหลายๆ บทบาท (Rest Parameter)
  return (req, res, next) => { 
    // ตรวจสอบว่า req.user (ที่มาจาก protect middleware) มีบทบาทที่ถูกต้องหรือไม่
    if (!req.user || !roles.includes(req.user.role)) { //req.user.role คือ role ของผู้ใช้ที่ล็อกอินอยู่  //!roles ถูกส่งเข้ามาตอนเรียก authorizeRoles
      return res.status(403).json({ message: `User role '${req.user ? req.user.role : 'unknown'}'
        is not authorized to access this route` });// ถ้าไม่มีบทบาทที่ถูกต้อง ให้ส่งข้อความว่าไม่ได้รับอนุญาต
    }
    next(); // ไปยัง Middleware หรือ Controller ถัดไป
  };
};