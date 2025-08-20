import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; 
// ไม่ได้ใช้ Booking, mongoose, Asset ในไฟล์นี้
// import Booking from "../models/Booking.js"; 
// import mongoose from "mongoose";
// import Asset from "../models/Asset.js";

export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });

    res.cookie("jwt", token, { // 🔹 ตั้งค่า cookie สำหรับ JWT
        httpOnly: true, // ห้าม JavaScript ฝั่ง frontend อ่าน cookie
        secure: process.env.NODE_ENV === "production", // ใช้ https ใน production
        sameSite: "Lax", // ป้องกัน CSRF (ใช้ "None" ถ้าจะส่งจาก frontend ต่าง origin)
        maxAge: 24 * 60 * 60 * 1000, // 1 วัน
    });
};

// 🔹 ลงทะเบียนผู้ใช้
export const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, role });

        if (user) {
            generateToken(user._id, res);
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in registerUser:", error);
        res.status(500).json({ message: "Server error during registration." }); // เพิ่มการจัดการข้อผิดพลาด
    }
};

// 🔹 เข้าสู่ระบบ
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        generateToken(user._id, res);
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

    // ตรวจสอบว่าผู้ที่เรียก API เป็น admin จริงหรือไม่
    if (!req.user || req.user.role !== 'admin') {
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
    const { newStatus } = req.params; // หรือ req.body.newStatus ขึ้นอยู่กับการส่งค่ามา

    const allowedStatuses = ['available', 'booked', 'onDuty', 'offDuty', 'resting', 'unavailable', 'cleaning']; // เพิ่ม 'cleaning'
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

        // ควรมีการตรวจสอบสถานะปัจจุบันก่อนเปลี่ยนสถานะตาม flow
        if (caddy.caddyStatus === newStatus) {
            return res.status(200).json({ message: `Caddy is already in '${newStatus}' status.`, caddy });
        }

        switch (caddy.caddyStatus) {
            case 'available':
                if (newStatus === 'booked' || newStatus === 'unavailable' || newStatus === 'resting') {
                    caddy.caddyStatus = newStatus;
                } else {
                    return res.status(400).json({ message: `Caddy status cannot be changed from 'available' to '${newStatus}'.` });
                }
                break;
            case 'booked':
                if (newStatus === 'onDuty' || newStatus === 'available') { // เพิ่ม 'available' เพื่อให้สามารถยกเลิกการจองได้
                    caddy.caddyStatus = newStatus;
                } else {
                    return res.status(400).json({ message: `Caddy status cannot be changed from 'booked' to '${newStatus}'. Only 'onDuty' or 'available' is allowed.` });
                }
                break;
            case 'onDuty':
                if (newStatus === 'cleaning' || newStatus === 'offDuty' || newStatus === 'resting') { // เพิ่ม 'cleaning'
                    caddy.caddyStatus = newStatus;
                } else {
                    return res.status(400).json({ message: `Caddy status cannot be changed from 'onDuty' to '${newStatus}'.` });
                }
                break;
            case 'cleaning': // สถานะใหม่หลังจากจบงาน เพื่อรอทำความสะอาด/พัก
                if (newStatus === 'available' || newStatus === 'resting' || newStatus === 'unavailable') {
                    caddy.caddyStatus = newStatus;
                } else {
                    return res.status(400).json({ message: `Caddy status cannot be changed from 'cleaning' to '${newStatus}'.` });
                }
                break;
            case 'offDuty':
            case 'resting':
            case 'unavailable':
                if (newStatus === 'available') {
                    caddy.caddyStatus = newStatus;
                } else {
                    return res.status(400).json({ message: `Caddy status cannot be changed from '${caddy.caddyStatus}' to '${newStatus}'. Only 'available' is allowed.` });
                }
                break;
            default: // สำหรับสถานะที่ไม่รู้จัก หรือสถานะเริ่มต้น
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
        secure: process.env.NODE_ENV === "production", // ใช้ https ใน production
        sameSite: "Lax",
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// 🔹 ดึงแคดดี้ที่ว่างอยู่
export const getAvailableCaddies = async (req, res) => {
    try {
        // req.user จะถูกกำหนดโดย middleware 'protect' หาก token ถูกต้อง
        // หากต้องการให้เฉพาะ user ที่ login เข้าถึงได้
        if (!req.user) {
             return res.status(401).json({ message: "Not authorized, please login to view caddies." });
        }

        const caddies = await User.find({ role: 'caddy', caddyStatus: 'available' }).select('-password -__v -createdAt -updatedAt'); // ไม่รวมข้อมูลที่ไม่จำเป็น
        res.status(200).json(caddies);
    } catch (error) {
        console.error("Error in getAvailableCaddies:", error);
        res.status(500).json({ message: error.message || 'Server error when fetching available caddies.' });
    }
};

// --- ฟังก์ชันช่วยเหลือสำหรับจอง Asset ตามจำนวน (และส่งคืน ID) ---
const reserveAssets = async (assetType, quantity, session) => {
    if (quantity <= 0) {
        return [];
    }

    const availableAssets = await Asset.find({
        type: assetType,
        status: "available"
    }).limit(quantity).session(session);

    if (availableAssets.length < quantity) {
        throw new Error(`Not enough ${assetType} available. Requested: ${quantity}, Available: ${availableAssets.length}`);
    }

    const assetIdsToUpdate = availableAssets.map(asset => asset._id);
    await Asset.updateMany(
        { _id: { $in: assetIdsToUpdate } },
        { $set: { status: "booked" } },
        { session: session }
    );

    return assetIdsToUpdate;
};

// --- ฟังก์ชันช่วยเหลือสำหรับจองแคดดี้ ---
const reserveCaddies = async (caddyIds, session) => {
    if (!caddyIds || caddyIds.length === 0) {
        return [];
    }

    const availableCaddies = await User.find({
        _id: { $in: caddyIds },
        role: 'caddy',
        caddyStatus: 'available'
    }).session(session);

    if (availableCaddies.length !== caddyIds.length) {
        const bookedCaddyIds = availableCaddies.map(caddy => caddy._id.toString());
        const unavailableRequestedCaddyIds = caddyIds.filter(id => !bookedCaddyIds.includes(id.toString()));
        throw new Error(`Some selected caddies are not available or do not exist/are not caddies: ${unavailableRequestedCaddyIds.join(', ')}`);
    }

    await User.updateMany(
        { _id: { $in: caddyIds } },
        { $set: { caddyStatus: "booked" } },
        { session: session }
    );

    return caddyIds;
};

// --- จองเวลาออกรอบ (Book Slot) ---
export const bookSlot = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { 
            courseType, 
            date, 
            timeSlot, 
            players, 
            groupName, 
            caddy, 
            totalPrice, 
            golfCartQty = 0, 
            golfBagQty = 0,    
        } = req.body;

        // ตรวจสอบว่ามีผู้ใช้ล็อกอินอยู่หรือไม่ (มาจาก middleware 'protect')
        if (!req.user || !req.user._id) {
            throw new Error("User not authenticated.");
        }

        const bookedGolfCartIds = await reserveAssets("golfCart", golfCartQty, session);
        const bookedGolfBagIds = await reserveAssets("golfBag", golfBagQty, session);
        const bookedCaddyIds = await reserveCaddies(caddy, session); 

        const booking = new Booking({
            user: req.user._id, // ใช้ ID ของผู้ใช้ที่ล็อกอินอยู่
            courseType,
            date,
            timeSlot,
            players,
            groupName,
            caddy: bookedCaddyIds, 
            totalPrice,
            isPaid: false, 
            golfCartQty,
            golfBagQty,
            bookedGolfCartIds: bookedGolfCartIds, 
            bookedGolfBagIds: bookedGolfBagIds,
            status: 'pending'    
        });

        await booking.save({ session });
        await session.commitTransaction();
        res.status(201).json({ message: "Booking Successful", booking });

    } catch (error) {
        await session.abortTransaction();
        console.error("Booking failed:", error);
        res.status(400).json({ error: error.message || "Failed to make booking." });
    } finally {
        session.endSession();
    }
};

// --- ดึงรายการจองทั้งหมด ---
export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('caddy', 'name email caddyStatus profilePic') // เพิ่ม profilePic
            .populate('bookedGolfCartIds', 'name type status')
            .populate('bookedGolfBagIds', 'name type status');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- อัปเดตรายการจอง (ยังไม่รวมการจัดการแคดดี้ หรือ Asset) ---
export const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (req.body.timeSlot) {
            booking.timeSlot = req.body.timeSlot;
        } else {
            return res.status(400).json(
                { message: "Only 'timeSlot' can be updated for this endpoint" });
        }

        const updatedBooking = await booking.save();
        res.status(200).json({
            message: "Booking updated successfully", booking: updatedBooking
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- ลบรายการจอง (Admin/Staff) ---
export const deleteBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const booking = await Booking.findById(req.params.id).session(session);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        
        // คืนสถานะ Asset
        if (booking.bookedGolfCartIds.length > 0) {
            await Asset.updateMany(
                { _id: { $in: booking.bookedGolfCartIds } },
                { $set: { status: "available" } },
                { session: session }
            );
        }
        if (booking.bookedGolfBagIds.length > 0) {
            await Asset.updateMany(
                { _id: { $in: booking.bookedGolfBagIds } },
                { $set: { status: "available" } },
                { session: session }
            );
        }

        // คืนสถานะ Caddy
        if (booking.caddy.length > 0) {
            await User.updateMany(
                { _id: { $in: booking.caddy } },
                { $set: { caddyStatus: "available" } },
                { session: session }
            );
        }

        await booking.deleteOne({ session });

        await session.commitTransaction();
        res.status(200).json({
            message: "Booking deleted successfully, assets and caddies returned to available."
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error deleting booking:", error);
        res.status(500).json({ error: error.message || "Failed to delete booking." });
    } finally {
        session.endSession();
    }
};

// --- ฟังก์ชัน: แคดดี้เริ่มงาน (Start Round) ---
export const startRound = async (req, res) => {
    const { bookingId } = req.params;
    const caddyId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await Booking.findById(bookingId).session(session);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // ตรวจสอบว่าแคดดี้ที่ล็อกอินอยู่ถูกมอบหมายให้กับการจองนี้หรือไม่
        if (!booking.caddy.map(id => id.toString()).includes(caddyId.toString())) {
            return res.status(403).json({ message: "You are not assigned to this booking." });
        }

        // ตรวจสอบสถานะปัจจุบันของ Asset และ Caddy ก่อนเปลี่ยน
        const currentCaddy = await User.findById(caddyId).session(session);
        if (!currentCaddy || currentCaddy.caddyStatus !== 'booked') {
            throw new Error("Caddy is not in 'booked' status or not found.");
        }

        // 1. เปลี่ยนสถานะของ Golf Carts จาก 'booked' เป็น 'inUse'
        if (booking.bookedGolfCartIds && booking.bookedGolfCartIds.length > 0) {
            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfCartIds }, status: 'booked' },
                { $set: { status: 'inUse' } },
                { session: session }
            );
            if (result.modifiedCount !== booking.bookedGolfCartIds.length) {
                throw new Error("Not all golf carts were in 'booked' status or updated.");
            }
        }

        // 2. เปลี่ยนสถานะของ Golf Bags จาก 'booked' เป็น 'inUse'
        if (booking.bookedGolfBagIds && booking.bookedGolfBagIds.length > 0) {
            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfBagIds }, status: 'booked' },
                { $set: { status: 'inUse' } },
                { session: session }
            );
            if (result.modifiedCount !== booking.bookedGolfBagIds.length) {
                throw new Error("Not all golf bags were in 'booked' status or updated.");
            }
        }

        // 3. เปลี่ยนสถานะของแคดดี้จาก 'booked' เป็น 'onDuty'
        await User.updateOne(
            { _id: caddyId, caddyStatus: 'booked' },
            { $set: { caddyStatus: 'onDuty' } },
            { session: session }
        );
        // 4. เปลี่ยนสถานะของ Booking จาก 'pending' เป็น 'onGoing'
        booking.status = 'onGoing';
        await booking.save({ session });

        await session.commitTransaction();
        res.status(200).json({ message: "Round started successfully. Assets and caddy are now in use.", booking });

    } catch (error) {
        await session.abortTransaction();
        console.error("Failed to start round:", error);
        res.status(400).json({ error: error.message || "Failed to start round." });
    } finally {
        session.endSession();
    }
};

// --- แคดดี้จบงาน (End Round) ---
export const endRound = async (req, res) => {
    const { bookingId } = req.params;
    const caddyId = req.user._id;

    console.log("--- Debugging endRound ---");
    console.log("Ending round for bookingId:", bookingId);
    console.log("Caddy ID:", caddyId.toString());

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await Booking.findById(bookingId).session(session);

        if (!booking) {
            console.log("Booking not found for ID:", bookingId);
            await session.abortTransaction();
            return res.status(404).json({ message: "Booking not found." });
        }
        console.log("Booking found. Current status:", booking.status);
        console.log("Booked Golf Cart IDs:", booking.bookedGolfCartIds.map(id => id.toString()));
        console.log("Booked Golf Bag IDs:", booking.bookedGolfBagIds.map(id => id.toString()));

        // ตรวจสอบว่าแคดดี้ที่ล็อกอินอยู่ถูกมอบหมายให้กับการจองนี้หรือไม่
        if (!booking.caddy.map(id => id.toString()).includes(caddyId.toString())) {
            console.log("Forbidden: Caddy not assigned to this booking.");
            await session.abortTransaction();
            return res.status(403).json({ message: "You are not assigned to this booking." });
        }
        console.log("Caddy is assigned to this booking.");

        // ตรวจสอบสถานะปัจจุบันของ Asset และ Caddy ก่อนเปลี่ยน
        const currentCaddy = await User.findById(caddyId).session(session);
        if (!currentCaddy || currentCaddy.caddyStatus !== 'onDuty') {
            console.log("Error: Caddy not in 'onDuty' status or not found. Current status:", currentCaddy ? currentCaddy.caddyStatus : 'Not Found');
            throw new Error("Caddy is not in 'onDuty' status or not found.");
        }
        console.log("Caddy status is 'onDuty'. Proceeding.");

        // 1. เปลี่ยนสถานะของ Golf Carts จาก 'inUse' เป็น 'clean'
        if (booking.bookedGolfCartIds && booking.bookedGolfCartIds.length > 0) {
            const currentCartStatuses = await Asset.find({ _id: { $in: booking.bookedGolfCartIds } }, 'name status').session(session);
            console.log("Current Golf Cart Statuses before update:", currentCartStatuses.map(c => ({ id: c._id.toString(), name: c.name, status: c.status })));

            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfCartIds }, status: 'inUse' },
                { $set: { status: 'clean' } },
                { session: session }
            );
            console.log("Golf Carts - Matched Count:", result.matchedCount, "Modified Count:", result.modifiedCount);

            if (result.modifiedCount !== booking.bookedGolfCartIds.length) {
                const unchangedCarts = currentCartStatuses.filter(cart => cart.status !== 'inUse');
                console.log("Golf Carts not in 'inUse' or not updated:", unchangedCarts.map(c => ({ id: c._id.toString(), name: c.name, status: c.status })));
                throw new Error("Not all golf carts were in 'inUse' status or updated.");
            }
        } else {
            console.log("No golf carts booked for this booking.");
        }

        // 2. เปลี่ยนสถานะของ Golf Bags จาก 'inUse' เป็น 'clean'
        if (booking.bookedGolfBagIds && booking.bookedGolfBagIds.length > 0) {
            const currentBagStatuses = await Asset.find({ _id: { $in: booking.bookedGolfBagIds } }, 'name status').session(session);
            console.log("Current Golf Bag Statuses before update:", currentBagStatuses.map(b => ({ id: b._id.toString(), name: b.name, status: b.status })));

            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfBagIds }, status: 'inUse' },
                { $set: { status: 'clean' } },
                { session: session }
            );
            console.log("Golf Bags - Matched Count:", result.matchedCount, "Modified Count:", result.modifiedCount);

            if (result.modifiedCount !== booking.bookedGolfBagIds.length) {
                const unchangedBags = currentBagStatuses.filter(bag => bag.status !== 'inUse');
                console.log("Golf Bags not in 'inUse' or not updated:", unchangedBags.map(b => ({ id: b._id.toString(), name: b.name, status: b.status })));
                throw new Error("Not all golf bags were in 'inUse' status or updated.");
            }
        } else {
            console.log("No golf bags booked for this booking.");
        }

        // 3. เปลี่ยนสถานะของแคดดี้จาก 'onDuty' เป็น 'cleaning'
        const caddyUpdateResult = await User.updateOne(
            { _id: caddyId, caddyStatus: 'onDuty' },
            { $set: { caddyStatus: 'cleaning' } },
            { session: session }
        );
        console.log("Caddy Update - Matched Count:", caddyUpdateResult.matchedCount, "Modified Count:", caddyUpdateResult.modifiedCount);

        if (caddyUpdateResult.modifiedCount === 0) {
            console.log("Caddy status not updated to 'cleaning'. Caddy ID:", caddyId.toString(), "Current status:", currentCaddy.caddyStatus);
            throw new Error("Caddy status could not be updated to 'cleaning'.");
        }
        console.log("Caddy status updated to 'cleaning'.");

        // 4. เปลี่ยนสถานะการจองเป็น 'completed'
        booking.status = 'completed'; // หรือ 'finished' หรือ 'ended' ตามที่คุณกำหนดใน Schema
        await booking.save({ session });
        console.log("Booking status updated to 'completed'.");

        await session.commitTransaction();
        res.status(200).json({ message: "Round ended successfully. Assets are now clean and caddy is cleaning.", booking });

    } catch (error) {
        await session.abortTransaction();
        console.error("Failed to end round:", error);
        res.status(400).json({ error: error.message || "Failed to end round." });
    } finally {
        session.endSession();
        console.log("--- End of endRound Debug ---");
    }
};

// --- แคดดี้ "ยกเลิกงานก่อนเริ่ม" (Cancel Before Start) ---
export const cancelBeforeStart = async (req, res) => {
    const { bookingId } = req.params;
    const caddyId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await Booking.findById(bookingId).session(session);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // ตรวจสอบว่าแคดดี้ที่ล็อกอินอยู่ถูกมอบหมายให้กับการจองนี้หรือไม่
        if (!booking.caddy.map(id => id.toString()).includes(caddyId.toString())) {
            return res.status(403).json({ message: "You are not assigned to this booking." });
        }

        // ตรวจสอบสถานะปัจจุบันของแคดดี้ (ต้องเป็น 'booked' เท่านั้น)
        const currentCaddy = await User.findById(caddyId).session(session);
        if (!currentCaddy || currentCaddy.caddyStatus !== 'booked') {
            throw new Error("Caddy is not in 'booked' status. Cannot cancel before start.");
        }

        // 1. เปลี่ยนสถานะ Golf Carts จาก 'booked' เป็น 'available'
        if (booking.bookedGolfCartIds && booking.bookedGolfCartIds.length > 0) {
            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfCartIds }, status: 'booked' },
                { $set: { status: 'available' } },
                { session: session }
            );
            if (result.modifiedCount !== booking.bookedGolfCartIds.length) {
                console.warn("Not all golf carts were in 'booked' status for cancellation.");
            }
        }

        // 2. เปลี่ยนสถานะ Golf Bags จาก 'booked' เป็น 'available'
        if (booking.bookedGolfBagIds && booking.bookedGolfBagIds.length > 0) {
            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfBagIds }, status: 'booked' },
                { $set: { status: 'available' } },
                { session: session }
            );
            if (result.modifiedCount !== booking.bookedGolfBagIds.length) {
                console.warn("Not all golf bags were in 'booked' status for cancellation.");
            }
        }

        // 3. เปลี่ยนสถานะแคดดี้จาก 'booked' เป็น 'available'
        await User.updateOne(
            { _id: caddyId, caddyStatus: 'booked' },
            { $set: { caddyStatus: 'available' } },
            { session: session }
        );

        // 4. "ปลด" แคดดี้และ Asset ออกจาก Booking นั้น
        booking.caddy = [];
        booking.bookedGolfCartIds = [];
        booking.bookedGolfBagIds = [];
        await booking.save({ session });

        await session.commitTransaction();
        res.status(200).json({ message: "Booking cancelled before start. Assets and caddy are now available.", booking });

    } catch (error) {
        await session.abortTransaction();
        console.error("Failed to cancel booking before start:", error);
        res.status(400).json({ error: error.message || "Failed to cancel booking before start." });
    } finally {
        session.endSession();
    }
};

// --- แคดดี้ "ยกเลิกงานระหว่างทำ" (Cancel During Round) ---
export const cancelDuringRound = async (req, res) => {
    const { bookingId } = req.params;
    const caddyId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await Booking.findById(bookingId).session(session);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // ตรวจสอบว่าแคดดี้ที่ล็อกอินอยู่ถูกมอบหมายให้กับการจองนี้หรือไม่
        if (!booking.caddy.map(id => id.toString()).includes(caddyId.toString())) {
            return res.status(403).json({ message: "You are not assigned to this booking." });
        }

        // ตรวจสอบสถานะปัจจุบันของแคดดี้ (ต้องเป็น 'onDuty' เท่านั้น)
        const currentCaddy = await User.findById(caddyId).session(session);
        if (!currentCaddy || currentCaddy.caddyStatus !== 'onDuty') {
            throw new Error("Caddy is not in 'onDuty' status. Cannot cancel during round.");
        }

        // 1. เปลี่ยนสถานะ Golf Carts จาก 'inUse' เป็น 'clean'
        if (booking.bookedGolfCartIds && booking.bookedGolfCartIds.length > 0) {
            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfCartIds }, status: 'inUse' },
                { $set: { status: 'clean' } },
                { session: session }
            );
            if (result.modifiedCount !== booking.bookedGolfCartIds.length) {
                console.warn("Not all golf carts were in 'inUse' status for cancellation.");
            }
        }

        // 2. เปลี่ยนสถานะ Golf Bags จาก 'inUse' เป็น 'clean'
        if (booking.bookedGolfBagIds && booking.bookedGolfBagIds.length > 0) {
            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfBagIds }, status: 'inUse' },
                { $set: { status: 'clean' } },
                { session: session }
            );
            if (result.modifiedCount !== booking.bookedGolfBagIds.length) {
                console.warn("Not all golf bags were in 'inUse' status for cancellation.");
            }
        }

        // 3. เปลี่ยนสถานะแคดดี้จาก 'onDuty' เป็น 'cleaning'
        await User.updateOne(
            { _id: caddyId, caddyStatus: 'onDuty' },
            { $set: { caddyStatus: 'cleaning' } },
            { session: session }
        );

        // 4. "ปลด" แคดดี้และ Asset ออกจาก Booking นั้น
        booking.caddy = [];
        booking.bookedGolfCartIds = [];
        booking.bookedGolfBagIds = [];
        await booking.save({ session });

        await session.commitTransaction();
        res.status(200).json({ message: "Round cancelled during play. Assets are now clean and caddy is cleaning.", booking });

    } catch (error) {
        await session.abortTransaction();
        console.error("Failed to cancel booking during round:", error);
        res.status(400).json({ error: error.message || "Failed to cancel booking during round." });
    } finally {
        session.endSession();
    }
};

// --- แคดดี้ "เปลี่ยนสถานะเป็นว่างพร้อมรถและถุงกอล์ฟ" (markCaddyAsAvailable) ---
export const markCaddyAsAvailable = async (req, res) => {
    const { bookingId } = req.params;
    const caddyId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. ตรวจสอบว่าผู้ใช้ที่เรียกฟังก์ชันนี้เป็น Caddy จริงหรือไม่
        const caddy = await User.findById(caddyId).session(session);
        if (!caddy) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Caddy not found." });
        }
        if (caddy.role !== 'caddy') {
            await session.abortTransaction();
            return res.status(403).json({ message: "Forbidden: Only caddies can perform this action." });
        }

        console.log(`Caddy '${caddy.name}' (ID: ${caddyId}) attempting to self-release for Booking ID: ${bookingId}`);

        // 2. ตรวจสอบ Booking ID ที่ให้มาว่ามีอยู่จริงหรือไม่
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Booking not found for the provided ID." });
        }

        // ตรวจสอบว่าแคดดี้ที่ล็อกอินอยู่ถูกมอบหมายให้กับการจองนี้หรือไม่
        if (!booking.caddy.map(id => id.toString()).includes(caddyId.toString())) {
            await session.abortTransaction();
            return res.status(403).json({ message: "You are not assigned to this booking." });
        }

        // 3. ตรวจสอบสถานะปัจจุบันของแคดดี้ (ต้องเป็น 'cleaning' ก่อนถึงจะเปลี่ยนเป็น 'available' ได้)
        if (caddy.caddyStatus === 'available') {
            await session.abortTransaction();
            return res.status(200).json({ message: "Caddy is already available.", caddy: caddy });
        }
        if (caddy.caddyStatus !== 'cleaning') {
            await session.abortTransaction();
            return res.status(400).json({ message: `Caddy status is '${caddy.caddyStatus}', not 'cleaning'. Caddy cannot self-release.` });
        }
        console.log(`Caddy current status is '${caddy.caddyStatus}'. Proceeding to change to 'available'.`);

        // 4. อัปเดตสถานะของรถกอล์ฟที่เกี่ยวข้องจาก 'clean' ให้เป็น 'available'
        if (booking.bookedGolfCartIds && booking.bookedGolfCartIds.length > 0) {
            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfCartIds }, status: 'clean' },
                { $set: { status: 'available' } },
                { session: session }
            );
            console.log(`Updated ${result.modifiedCount} golf carts from 'clean' to 'available'.`);
            if (result.modifiedCount !== booking.bookedGolfCartIds.length) {
                console.warn("Some golf carts were not in 'clean' status or could not be updated to 'available'.");
            }
        } else {
            console.log("No golf carts booked for this booking.");
        }

        // 5. อัปเดตสถานะของถุงกอล์ฟที่เกี่ยวข้องจาก 'clean' ให้เป็น 'available'
        if (booking.bookedGolfBagIds && booking.bookedGolfBagIds.length > 0) {
            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfBagIds }, status: 'clean' },
                { $set: { status: 'available' } },
                { session: session }
            );
            console.log(`Updated ${result.modifiedCount} golf bags from 'clean' to 'available'.`);
            if (result.modifiedCount !== booking.bookedGolfBagIds.length) {
                console.warn("Some golf bags were not in 'clean' status or could not be updated to 'available'.");
            }
        } else {
            console.log("No golf bags booked for this booking.");
        }

        // 6. เปลี่ยนสถานะของแคดดี้เป็น 'available'
        const oldStatus = caddy.caddyStatus;
        caddy.caddyStatus = 'available';
        await caddy.save({ session });
        console.log(`Caddy '${caddy.name}' status updated from '${oldStatus}' to 'available'.`);

        // Commit Transaction หากทุกอย่างสำเร็จ
        await session.commitTransaction();
        res.status(200).json({
            message: `Caddy '${caddy.name}' and associated assets are now available.`,
            caddy: {
                _id: caddy._id,
                name: caddy.name,
                email: caddy.email,
                role: caddy.role,
                caddyStatus: caddy.caddyStatus,
            },
            bookingIdAcknowledged: bookingId
        });

    } catch (error) {
        // Rollback Transaction หากมีข้อผิดพลาดเกิดขึ้น
        await session.abortTransaction();
        console.error("Error in markCaddyAsAvailable:", error);
        res.status(500).json({ message: 'Server error.', error: error.message || "Failed to mark caddy and assets as available." });
    } finally {
        // ปิด Session ของ Transaction
        session.endSession();
        console.log("--- End of markCaddyAsAvailable Debug ---");
    }
};
// แก้เพิ่มและต้องปรับ logic ทีหลังให้โค้ดไม่เยอะเกิน
