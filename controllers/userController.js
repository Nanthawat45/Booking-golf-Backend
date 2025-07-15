import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Booking from "../models/Booking.js";
import mongoose from "mongoose";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_MODE !== "development", // ต้องใช้ https ใน production
    sameSite: "Lax", // ป้องกัน CSRF (ใช้ "None" ถ้าจะส่งจาก frontend ต่าง origin)
    maxAge: 24 * 60 * 60 * 1000, // 1 วัน
  });
};

// 🔹 ลงทะเบียนผู้ใช้
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword, role: 'user' });

  if (user) {
    generateToken(user._id, res); // set cookie
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// 🔹 เข้าสู่ระบบ
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    generateToken(user._id, res); // set cookie
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

// 🔹 ดึงข้อมูลโปรไฟล์
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    res.json({
       _id: user.id, 
       name: user.name, 
       email: user.email, 
       role: user.role,
     });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// 🔹 แอดมินสร้างรหัส caddy starter
export const registerByAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  const allowedRoles = ['admin', 'caddy', 'starter'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role specified" });
  }

  const adminUser = await User.findById(req.user.id);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ message: "Only admins can perform this action" });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({ name, email, password: hashedPassword, role });

  if (newUser) {
    res.status(201).json({
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });
  } else {
    res.status(400).json({ message: "Failed to create user" });
  }
};

// 🔹 ดึงผู้ใช้ทั้งหมด
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// 🔹 ดึงผู้ใช้ด้วย ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // ไม่รวม password
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// 🔹 อัปเดตข้อมูลผู้ใช้
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;

      if (req.body.password) {
        user.password = await bcrypt.hash(req.body.password, 10);
      }

      const updatedUser = await user.save();
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// 🔹 ลบผู้ใช้
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.status(200).json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// 🔹 Controller สำหรับอัปเดตสถานะแคดดี้
export const updateCaddyStatus = async (req, res) => {
  const { id } = req.params; 
  const { newStatus } = req.params; 

  const allowedStatuses = ['available', 'booked', 'onDuty', 'offDuty', 'resting', 'unavailable'];
  if (!allowedStatuses.includes(newStatus)) {
    return res.status(400).json({ message: `Invalid status: ${newStatus}. Allowed statuses are: ${allowedStatuses.join(', ')}` });
  }

  try {
    const caddy = await User.findById(id);

    if (!caddy) {
      return res.status(404).json({ message: "Caddy not found." });
    }

    if (caddy.role !== 'caddy') {
      return res.status(403).json({ message: "Only users with 'caddy' role can have their status updated via this endpoint." });
    }

    let message = `Caddy '${caddy.name}' status updated from '${caddy.caddyStatus}' to '${newStatus}'.`;

    switch (caddy.caddyStatus) {
      case 'booked': 
        if (newStatus === 'onDuty') {
          caddy.caddyStatus = newStatus;
        } else {
          return res.status(400).json({ message: `Caddy status cannot be changed from 'booked' to '${newStatus}'. Only 'onDuty' is allowed.` });
        }
        break;
      case 'onDuty': 
        if (newStatus === 'offDuty' || newStatus === 'resting' || newStatus === 'available') { 
          caddy.caddyStatus = newStatus;
        } else {
          return res.status(400).json({ message: `Caddy status cannot be changed from 'onDuty' to '${newStatus}'.` });
        }
        break;
      case 'available': 
        if (newStatus === 'unavailable' || newStatus === 'resting') {
            caddy.caddyStatus = newStatus;
        } else {
            return res.status(400).json({ message: `Caddy status cannot be changed from 'available' to '${newStatus}'.` });
        }
        break;
      default: 
        caddy.caddyStatus = newStatus;
        break;
    }

    const updatedCaddy = await caddy.save();
    res.status(200).json({ message, caddy: updatedCaddy });

  } catch (error) {
    console.error(`Error updating caddy status for ${id}:`, error);
    res.status(500).json({ error: error.message || "Failed to update caddy status." });
  }
};

// 🔹 ลงชื่อออก (Logout)
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0), // กำหนดให้ cookie หมดอายุทันที
  });
  res.status(200).json({ message: 'Logged out successfully' });
};



export const markCaddyAsAvailable = async (req, res) => {
    const caddyId = req.user._id; // ID ของแคดดี้ที่ล็อกอินอยู่

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const caddy = await User.findById(caddyId).session(session);

        if (!caddy) {
            return res.status(404).json({ message: "Caddy not found." });
        }

        // ตรวจสอบว่าแคดดี้อยู่ในสถานะ 'cleaning' หรือไม่
        if (caddy.caddyStatus !== 'cleaning') {
            return res.status(400).json({ message: "Caddy is not in 'cleaning' status. Cannot mark as available." });
        }

        // เปลี่ยนสถานะแคดดี้จาก 'cleaning' เป็น 'available'
        await User.updateOne(
            { _id: caddyId, caddyStatus: 'cleaning' },
            { $set: { caddyStatus: 'available' } },
            { session: session }
        );

        // หมายเหตุ: การเปลี่ยนสถานะของ Asset (รถ/ถุงกอล์ฟ) จาก 'clean' เป็น 'available'
        // จะเกิดขึ้นเมื่อแคดดี้กด "จบงาน" (End Round) แล้ว Asset จะเปลี่ยนเป็น 'clean' ทันที
        // และถ้าต้องการให้ Asset กลับมา 'available' แคดดี้อาจจะต้องแจ้ง Staff/Admin
        // หรือมีฟังก์ชันแยกต่างหากสำหรับ Asset ที่ 'clean' แล้วให้กลับมา 'available'
        // แต่ตาม Flow ที่เราตกลงกันล่าสุด (ข้อ 7) แคดดี้เป็นคนเปลี่ยนสถานะตัวเองเป็น 'available'
        // ส่วน Asset จะเป็น 'available' ทันทีที่กด End Round
        // ดังนั้น ฟังก์ชันนี้จะจัดการแค่สถานะ Caddy เท่านั้น

        await session.commitTransaction();
        res.status(200).json({ message: "Caddy is now available after cleaning.", caddyStatus: 'available' });

    } catch (error) {
        await session.abortTransaction();
        console.error("Failed to mark caddy as available:", error);
        res.status(400).json({ error: error.message || "Failed to mark caddy as available." });
    } finally {
        session.endSession();
    }
};

// 🔹 ดึงรายการจองที่แคดดี้ถูกมอบหมาย (สำหรับแคดดี้เท่านั้น)
// เพื่อให้แคดดี้สามารถดูงานของตัวเองได้
export const getMyAssignedBookings = async (req, res) => {
    const caddyId = req.user._id; // ID ของแคดดี้ที่ล็อกอินอยู่

    try {
        const bookings = await Booking.find({ 
            caddy: caddyId, // กรอง Booking ที่มี ID แคดดี้คนนี้อยู่ใน array 'caddy'
            // สามารถเพิ่ม filter วันที่ได้ เช่น date: { $gte: new Date() }
        })
        .populate('user', 'name email') // ดึงข้อมูลผู้ใช้ที่จอง
        .populate('bookedGolfCartIds', 'name type status') // ดึงข้อมูลรถกอล์ฟที่จอง
        .populate('bookedGolfBagIds', 'name type status') // ดึงข้อมูลถุงกอล์ฟที่จอง
        .sort({ date: 1, timeSlot: 1 }); // เรียงตามวันที่และเวลา

        res.status(200).json(bookings);

    } catch (error) {
        console.error("Error fetching caddy's assigned bookings:", error);
        res.status(500).json({ error: error.message || "Failed to fetch assigned bookings." });
    }
};