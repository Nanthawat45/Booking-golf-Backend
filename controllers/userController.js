import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// 🔹 ลงทะเบียนผู้ใช้
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword, role: 'user'});

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
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
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
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