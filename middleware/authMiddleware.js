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
