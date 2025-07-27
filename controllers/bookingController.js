import Booking from '../models/Booking.js';
import Asset from '../models/Asset.js'; // ตรวจสอบว่าเส้นทางถูกต้อง
import User from '../models/User.js';   // ตรวจสอบว่าเส้นทางถูกต้อง
import mongoose from 'mongoose';

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
    throw new Error(`Not enough ${assetType}s available. Requested: ${quantity}, Available: ${availableAssets.length}`);
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
    return []; // คืนค่า array ว่าง ถ้าไม่มีการเลือกแคดดี้
  }

  // ค้นหาแคดดี้ที่ถูกเลือก และต้องมี role เป็น 'caddy' และ status เป็น 'available'
  const availableCaddies = await User.find({
    _id: { $in: caddyIds },
    role: 'caddy',
    caddyStatus: 'available'
  }).session(session);

  // ตรวจสอบว่าแคดดี้ที่เลือกมาทั้งหมดว่างจริงหรือไม่
  if (availableCaddies.length !== caddyIds.length) {
    const bookedCaddyIds = availableCaddies.map(caddy => caddy._id.toString());
    const unavailableRequestedCaddyIds = caddyIds.filter(id => !bookedCaddyIds.includes(id.toString()));
    throw new Error(`Some selected caddies are not available or do not exist/are not caddies: ${unavailableRequestedCaddyIds.join(', ')}`);
  }

  // เปลี่ยนสถานะของแคดดี้ที่จองแล้วให้เป็น "booked"
  await User.updateMany(
    { _id: { $in: caddyIds } },
    { $set: { caddyStatus: "booked" } },
    { session: session }
  );

  return caddyIds; // ส่งคืน ID ของแคดดี้ที่ถูกจองไปแล้ว
};


// --- 🔹 จองเวลาออกรอบ (Book Slot) ---
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

    const bookedGolfCartIds = await reserveAssets("golfCart", golfCartQty, session);
    const bookedGolfBagIds = await reserveAssets("golfBag", golfBagQty, session);
    const bookedCaddyIds = await reserveCaddies(caddy, session); 

    const booking = new Booking({
      user: req.user._id, 
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

// --- 🔹 ดึงรายการจองทั้งหมด ---
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('caddy', 'name email caddyStatus') 
      .populate('bookedGolfCartIds', 'name type status') 
      .populate('bookedGolfBagIds', 'name type status'); 
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 🔹 อัปเดตรายการจอง (ยังไม่รวมการจัดการแคดดี้ หรือ Asset) ---
export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (req.body.timeSlot) {
      booking.timeSlot = req.body.timeSlot;
    } else {
      return res.status(400).json({ message: "Only 'timeSlot' can be updated for this endpoint" });
    }

    const updatedBooking = await booking.save();

    res.status(200).json({ message: "Booking updated successfully", booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 🔹 ลบรายการจอง (Admin/Staff) ---
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
    res.status(200).json({ message: "Booking deleted successfully, assets and caddies returned to available." });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: error.message || "Failed to delete booking." });
  } finally {
    session.endSession();
  }
};

// --- ✅ ฟังก์ชัน: แคดดี้เริ่มงาน (Start Round) ---
export const startRound = async (req, res) => {
  const { bookingId } = req.params;
  const caddyId = req.user._id; // ID ของแคดดี้ที่ล็อกอินอยู่

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

// --- ✅ ฟังก์ชัน: แคดดี้จบงาน (End Round) ---
export const endRound = async (req, res) => {
    const { bookingId } = req.params;
    const caddyId = req.user._id; // ID ของแคดดี้ที่ล็อกอินอยู่

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
            // ดึงสถานะปัจจุบันของรถกอล์ฟทั้งหมดที่เกี่ยวข้อง
            const currentCartStatuses = await Asset.find({ _id: { $in: booking.bookedGolfCartIds } }, 'name status').session(session);
            console.log("Current Golf Cart Statuses before update:", currentCartStatuses.map(c => ({ id: c._id.toString(), name: c.name, status: c.status })));

            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfCartIds }, status: 'inUse' }, // เงื่อนไข: ต้องเป็น 'inUse' เท่านั้น
                { $set: { status: 'clean' } },
                { session: session }
            );
            console.log("Golf Carts - Matched Count:", result.matchedCount, "Modified Count:", result.modifiedCount);

            if (result.modifiedCount !== booking.bookedGolfCartIds.length) {
                // ถ้าจำนวนที่ถูกแก้ไม่เท่ากับจำนวนรถกอล์ฟทั้งหมด แสดงว่ามีบางคันไม่ได้อยู่ใน 'inUse'
                const unchangedCarts = currentCartStatuses.filter(cart => cart.status !== 'inUse');
                console.log("Golf Carts not in 'inUse' or not updated:", unchangedCarts.map(c => ({ id: c._id.toString(), name: c.name, status: c.status })));
                throw new Error("Not all golf carts were in 'inUse' status or updated.");
            }
        } else {
            console.log("No golf carts booked for this booking.");
        }

        // 2. เปลี่ยนสถานะของ Golf Bags จาก 'inUse' เป็น 'clean'
        if (booking.bookedGolfBagIds && booking.bookedGolfBagIds.length > 0) {
            // ดึงสถานะปัจจุบันของถุงกอล์ฟทั้งหมดที่เกี่ยวข้อง
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

// --- ✅ ฟังก์ชันใหม่: แคดดี้ "ยกเลิกงานก่อนเริ่ม" (Cancel Before Start) ---
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

// --- ✅ ฟังก์ชันใหม่: แคดดี้ "ยกเลิกงานระหว่างทำ" (Cancel During Round) ---
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

export const replaceGolfCart = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { bookingId } = req.params;
        const { oldGolfCartId, newGolfCartId } = req.body;

        // 1. ตรวจสอบสิทธิ์ผู้ใช้ (Starter หรือ Admin เท่านั้น)
        if (!req.user || (req.user.role !== 'starter' && req.user.role !== 'admin')) {
            await session.abortTransaction();
            return res.status(403).json({ message: 'Forbidden: Only Starter or Admin can replace golf carts.' });
        }

        console.log("--- Debugging replaceGolfCart ---");
        console.log("Received bookingId from params:", bookingId);
        console.log("Received oldGolfCartId from body:", oldGolfCartId);
        console.log("Received newGolfCartId from body:", newGolfCartId);
        console.log("User Role performing replacement:", req.user.role);

        // 2. ค้นหา Booking
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) {
            console.log("Booking not found for ID:", bookingId);
            await session.abortTransaction();
            return res.status(404).json({ message: 'Booking not found.' });
        }
        console.log("Booking found. Current Booking Status:", booking.status);

        // 3. ตรวจสอบว่า oldGolfCartId อยู่ใน Booking นั้นจริงหรือไม่
        const bookedGolfCartStrings = booking.bookedGolfCartIds.map(id => id.toString());
        if (!bookedGolfCartStrings.includes(oldGolfCartId.toString())) {
            await session.abortTransaction();
            return res.status(400).json({ message: `Old golf cart with ID '${oldGolfCartId}' is not associated with this booking.` });
        }

        // 4. ค้นหารถกอล์ฟทั้งสองคัน
        const oldGolfCart = await Asset.findById(oldGolfCartId).session(session);
        const newGolfCart = await Asset.findById(newGolfCartId).session(session);

        if (!oldGolfCart || !newGolfCart) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'One or both golf carts not found.' });
        }

        console.log("Old Golf Cart found: Name:", oldGolfCart.name, "Current Status:", oldGolfCart.status);
        console.log("New Golf Cart found: Name:", newGolfCart.name, "Current Status:", newGolfCart.status);

        // 5. ตรวจสอบว่า newGolfCart เป็นสถานะ 'spare' หรือ 'available' ที่สามารถนำมาใช้แทนได้
        if (newGolfCart.status !== 'spare' && newGolfCart.status !== 'available') {
            await session.abortTransaction();
            return res.status(400).json({ message: `New golf cart ('${newGolfCart.name}' ID: ${newGolfCart.assetId}) is not in 'spare' or 'available' status. Current status: ${newGolfCart.status}.` });
        }
        
        // 6. กำหนดสถานะใหม่ของรถสำรอง (newCartAssignedStatus)
        // ✅ บังคับให้เป็น 'inUse' เสมอเมื่อมีการเปลี่ยนรถ (ตามที่คุณต้องการ)
        const newCartAssignedStatus = 'inUse'; 
        console.log(`Logic Applied: Forcing new golf cart status to '${newCartAssignedStatus}' upon replacement.`);
        
        // 7. อัปเดตสถานะของรถกอล์ฟเก่า (ให้เป็น broken) และรถกอล์ฟใหม่
        oldGolfCart.status = 'broken';
        await oldGolfCart.save({ session });
        console.log(`Old Golf Cart ('${oldGolfCart.name}') status updated to 'broken'.`);

        newGolfCart.status = newCartAssignedStatus; 
        await newGolfCart.save({ session });
        console.log(`New Golf Cart ('${newGolfCart.name}') status updated to '${newCartAssignedStatus}'.`);

        // ✅ 8. หารถ available มาแทนที่รถ spare ที่เพิ่งถูกใช้งานไป (ส่วนนี้ถูกนำกลับมา)
        // ตรวจสอบว่าเป็นรถกอล์ฟ และสถานะที่กำหนดให้เป็น 'inUse' จริงๆ
        if (newGolfCart.type === 'golfCart' && newCartAssignedStatus === 'inUse') {
            console.log("Searching for an available golf cart to replace the 'spare' position...");
            // ค้นหารถกอล์ฟที่มีสถานะ 'available' และนำมาเปลี่ยนเป็น 'spare'
            const availableGolfCart = await Asset.findOneAndUpdate(
                { type: 'golfCart', status: 'available' },
                { $set: { status: 'spare' } },
                { new: true, session: session } // new: true จะคืนค่าเอกสารที่อัปเดตแล้ว
            );

            if (availableGolfCart) {
                console.log(`Found and updated Asset '${availableGolfCart.name}' (ID: ${availableGolfCart._id}) from 'available' to 'spare'.`);
            } else {
                console.log("No available golf cart found to fill the 'spare' position. Please ensure there's always an 'available' cart for backup.");
                // คุณอาจจะพิจารณาการส่งการแจ้งเตือนไปยังผู้ดูแลระบบที่นี่
            }
        } else {
            console.log("No need to find a new 'spare' golf cart (either new golf cart is not 'inUse' or not a golf cart type).");
        }

        // 9. อัปเดตข้อมูล Booking เพื่ออ้างอิงรถกอล์ฟคันใหม่
        booking.bookedGolfCartIds = booking.bookedGolfCartIds.filter(id => id.toString() !== oldGolfCartId.toString());
        booking.bookedGolfCartIds.push(newGolfCart._id);
        await booking.save({ session });
        console.log("Booking's golf cart list updated. Final bookedGolfCartIds:", booking.bookedGolfCartIds.map(id => id.toString()));

        await session.commitTransaction();
        console.log("Transaction committed successfully.");

        // 10. ส่ง Response กลับ
        res.status(200).json({
            message: 'Golf cart replaced successfully. New cart is in use, and spare slot replenished if available.',
            booking: booking,
            replacedCart: oldGolfCart,
            newActiveCart: newGolfCart 
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error in replaceGolfCart:', error);
        res.status(500).json({ message: 'Server error.', error: error.message || "Failed to replace golf cart." });
    } finally {
        session.endSession();
        console.log("--- End of replaceGolfCart Debug ---");
    }
};

export const markCaddyAsAvailable = async (req, res) => {
    const { bookingId } = req.params; // ✅ รับ bookingId จาก Path Parameter
    const caddyId = req.user._id;     // ID ของแคดดี้ที่ล็อกอินอยู่

    console.log("--- Debugging markCaddyAsAvailable ---");
    console.log("Marking caddy and assets available for bookingId:", bookingId); // เพิ่ม log
    console.log("Caddy ID:", caddyId.toString());

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. ตรวจสอบสถานะ Caddy ปัจจุบัน
        const caddy = await User.findById(caddyId).session(session);
        if (!caddy) {
            console.log("Caddy not found for ID:", caddyId);
            await session.abortTransaction();
            return res.status(404).json({ message: "Caddy not found." });
        }
        console.log("Caddy found. Current Caddy Status:", caddy.caddyStatus);

        // ต้องอยู่ในสถานะ 'cleaning' เท่านั้น จึงจะสามารถเปลี่ยนเป็น 'available' ได้
        if (caddy.caddyStatus !== 'cleaning') {
            console.log(`Caddy is not in 'cleaning' status. Current status: ${caddy.caddyStatus}. Cannot mark as available.`);
            await session.abortTransaction();
            return res.status(400).json({ message: `Caddy is not in 'cleaning' status. Current status: ${caddy.caddyStatus}. Cannot mark as available.` });
        }

        // 2. หายอดจองที่ระบุด้วย bookingId และตรวจสอบว่า completed และเกี่ยวข้องกับ caddy นี้
        // ✅ เปลี่ยนจากการหา latestCompletedBooking มาเป็นหา booking โดยตรงจาก bookingId
        const booking = await Booking.findById(bookingId).session(session);

        if (!booking) {
            console.log("Booking not found for ID:", bookingId);
            await session.abortTransaction();
            return res.status(404).json({ message: "Booking not found." });
        }
        console.log("Booking found. Current status:", booking.status);

        // ตรวจสอบว่า Caddy ที่ล็อกอินอยู่ถูกมอบหมายให้กับการจองนี้หรือไม่
        // *** สำคัญ: เลือกใช้ให้ตรงกับ Schema Booking ของคุณ (caddyId หรือ caddy Array) ***
        // ถ้า booking.caddyId เป็น ObjectId เดี่ยวๆ:
        if (!booking.caddyId || booking.caddyId.toString() !== caddyId.toString()) {
        // ถ้า booking.caddy เป็น Array ของ ObjectId:
        // if (!booking.caddy || booking.caddy.length === 0 || !booking.caddy.map(id => id.toString()).includes(caddyId.toString())) {
            console.log("Forbidden: Caddy not assigned to this booking.");
            await session.abortTransaction();
            return res.status(403).json({ message: "You are not assigned to this booking." });
        }
        console.log("Caddy is assigned to this booking.");

        // ตรวจสอบสถานะของ Booking ต้องเป็น 'completed' เท่านั้น
        if (booking.status !== 'completed') {
            console.log(`Booking is not in 'completed' status. Current status: ${booking.status}. Cannot mark assets as available.`);
            await session.abortTransaction();
            return res.status(400).json({ message: `Booking is not in 'completed' status. Current status: ${booking.status}.` });
        }

        console.log(`Processing completed booking (ID: ${booking._id}) for caddy.`);
        console.log("Booked Golf Cart IDs:", booking.bookedGolfCartIds.map(id => id.toString()));
        console.log("Booked Golf Bag IDs:", booking.bookedGolfBagIds.map(id => id.toString()));


        // 3. อัปเดตสถานะของ Golf Carts จาก 'clean' เป็น 'available'
        let updatedGolfCartsCount = 0;
        if (booking.bookedGolfCartIds && booking.bookedGolfCartIds.length > 0) {
            const resultCarts = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfCartIds }, status: 'clean' }, // เงื่อนไข: ต้องเป็น 'clean' เท่านั้น
                { $set: { status: 'available' } },
                { session: session }
            );
            updatedGolfCartsCount = resultCarts.modifiedCount;
            console.log("Golf Carts - Matched Count:", resultCarts.matchedCount, "Modified Count:", resultCarts.modifiedCount);
            if (resultCarts.matchedCount !== booking.bookedGolfCartIds.length) {
                console.warn("WARNING: Some golf carts might not have been in 'clean' status or updated.");
            }
        } else {
            console.log("No golf carts found in this booking.");
        }

        // 4. อัปเดตสถานะของ Golf Bags จาก 'clean' เป็น 'available'
        let updatedGolfBagsCount = 0;
        if (booking.bookedGolfBagIds && booking.bookedGolfBagIds.length > 0) {
            const resultBags = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfBagIds }, status: 'clean' }, // เงื่อนไข: ต้องเป็น 'clean' เท่านั้น
                { $set: { status: 'available' } },
                { session: session }
            );
            updatedGolfBagsCount = resultBags.modifiedCount;
            console.log("Golf Bags - Matched Count:", resultBags.matchedCount, "Modified Count:", resultBags.modifiedCount);
            if (resultBags.matchedCount !== booking.bookedGolfBagIds.length) {
                 console.warn("WARNING: Some golf bags might not have been in 'clean' status or updated.");
            }
        } else {
            console.log("No golf bags found in this booking.");
        }

        // 5. เปลี่ยนสถานะของแคดดี้จาก 'cleaning' เป็น 'available'
        caddy.caddyStatus = 'available';
        await caddy.save({ session });
        console.log("Caddy status updated to 'available'.");

        await session.commitTransaction();

        res.status(200).json({
            message: "Caddy and associated assets for this booking are now available after cleaning.",
            caddy: {
                _id: caddy._id,
                name: caddy.name,
                caddyStatus: caddy.caddyStatus
            },
            golfCartsUpdated: updatedGolfCartsCount,
            golfBagsUpdated: updatedGolfBagsCount
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in markCaddyAsAvailable:", error);
        res.status(500).json({ message: 'Server error.', error: error.message || "Failed to mark caddy and assets as available." });
    } finally {
        session.endSession();
        console.log("--- End of markCaddyAsAvailable Debug ---");
    }
};

export const caddySelfRelease = async (req, res) => {
    // ดึง bookingId จาก URL parameters
    const { bookingId } = req.params;
    // ดึง ID ของแคดดี้ที่ล็อกอินอยู่จาก req.user (มาจาก middleware 'protect')
    const caddyId = req.user._id;

    // เริ่ม MongoDB Transaction เพื่อให้แน่ใจว่าการอัปเดตทั้งหมดสำเร็จหรือล้มเหลวพร้อมกัน
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
        // แปลง ObjectId เป็น String เพื่อเปรียบเทียบ
        if (!booking.caddy.map(id => id.toString()).includes(caddyId.toString())) {
            await session.abortTransaction();
            return res.status(403).json({ message: "You are not assigned to this booking." });
        }

        // 3. ตรวจสอบสถานะของ Booking ว่าได้ "completed" แล้วหรือไม่
        // นี่คือการยืนยันว่าได้ผ่านขั้นตอน endRound มาแล้ว
        // if (booking.status !== 'completed') {
        //     await session.abortTransaction();
        //     return res.status(400).json({ message: `Booking ID '${bookingId}' is not yet completed. Caddy cannot be released.` });
        // }
        // console.log(`Booking ID '${bookingId}' status is 'completed'. Proceeding.`);

        // 4. ตรวจสอบสถานะปัจจุบันของแคดดี้ (ต้องเป็น 'cleaning' ก่อนถึงจะเปลี่ยนเป็น 'available' ได้)
        if (caddy.caddyStatus === 'available') {
            // ถ้าแคดดี้ว่างอยู่แล้ว ก็ไม่ต้องทำอะไร
            await session.abortTransaction();
            return res.status(200).json({ message: "Caddy is already available.", caddy: caddy });
        }
        if (caddy.caddyStatus !== 'cleaning') {
            // ถ้าแคดดี้ไม่ได้อยู่ในสถานะ 'cleaning' ก็ไม่อนุญาตให้ปลดตัวเอง
            await session.abortTransaction();
            return res.status(400).json({ message: `Caddy status is '${caddy.caddyStatus}', not 'cleaning'. Caddy cannot self-release.` });
        }
        console.log(`Caddy current status is '${caddy.caddyStatus}'. Proceeding to change to 'available'.`);


        // 5. อัปเดตสถานะของรถกอล์ฟที่เกี่ยวข้องจาก 'clean' ให้เป็น 'available'
        if (booking.bookedGolfCartIds && booking.bookedGolfCartIds.length > 0) {
            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfCartIds }, status: 'clean' }, // ค้นหาเฉพาะ Asset ที่อยู่ในสถานะ 'clean'
                { $set: { status: 'available' } }, // เปลี่ยนสถานะเป็น 'available'
                { session: session }
            );
            console.log(`Updated ${result.modifiedCount} golf carts from 'clean' to 'available'.`);
            // คุณอาจต้องการเพิ่มการตรวจสอบว่าจำนวน Asset ที่อัปเดตตรงกับที่คาดหวังหรือไม่
            if (result.modifiedCount !== booking.bookedGolfCartIds.length) {
                console.warn("Some golf carts were not in 'clean' status or could not be updated to 'available'.");
            }
        } else {
            console.log("No golf carts booked for this booking.");
        }

        // 6. อัปเดตสถานะของถุงกอล์ฟที่เกี่ยวข้องจาก 'clean' ให้เป็น 'available'
        if (booking.bookedGolfBagIds && booking.bookedGolfBagIds.length > 0) {
            const result = await Asset.updateMany(
                { _id: { $in: booking.bookedGolfBagIds }, status: 'clean' }, // ค้นหาเฉพาะ Asset ที่อยู่ในสถานะ 'clean'
                { $set: { status: 'available' } }, // เปลี่ยนสถานะเป็น 'available'
                { session: session }
            );
            console.log(`Updated ${result.modifiedCount} golf bags from 'clean' to 'available'.`);
            if (result.modifiedCount !== booking.bookedGolfBagIds.length) {
                console.warn("Some golf bags were not in 'clean' status or could not be updated to 'available'.");
            }
        } else {
            console.log("No golf bags booked for this booking.");
        }

        // 7. เปลี่ยนสถานะของแคดดี้เป็น 'available'
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
            bookingIdAcknowledged: bookingId // ส่ง bookingId ที่รับมากลับไปเพื่อยืนยัน
        });

    } catch (error) {
        // Rollback Transaction หากมีข้อผิดพลาดเกิดขึ้น
        await session.abortTransaction();
        console.error("Error in caddySelfRelease:", error);
        res.status(500).json({ message: 'Server error.', error: error.message || "Failed to mark caddy and assets as available." });
    } finally {
        // ปิด Session ของ Transaction
        session.endSession();
        console.log("--- End of caddySelfRelease Debug ---");
    }
};