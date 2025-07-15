import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🔹 ตรวจสอบ JWT Token จาก Cookie
export const protect = async (req, res, next) => {
  const token = req.cookies.jwt; // ✅ อ่านจาก cookie

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ✅ ถอดรหัส token
    req.user = await User.findById(decoded.userId).select("-password"); // ✅ userId เพราะใน token ใส่ userId
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // ตรวจสอบว่า req.user (ที่มาจาก protect middleware) มีบทบาทที่ถูกต้องหรือไม่
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this route` });
    }
    next(); // ไปยัง Middleware หรือ Controller ถัดไป
  };
};