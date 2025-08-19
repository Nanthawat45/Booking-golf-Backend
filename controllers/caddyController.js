import Booking from '../models/Booking.js';
import Asset from '../models/Asset.js'; // ตรวจสอบว่าเส้นทางถูกต้อง
import User from '../models/User.js';   // ตรวจสอบว่าเส้นทางถูกต้อง
import mongoose from 'mongoose';

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
    // 4. เพิ่ม: เปลี่ยนสถานะของ Booking จาก 'pending' เป็น 'onGoing'
        booking.status = 'onGoing'; //booking.status คือการเปลี่ยนสถานะการจอง //อัพเดทข้อมูลอันเดียว
        await booking.save({ session }); // บันทึกการเปลี่ยนแปลงสถานะการจอง // session ช่วยให้การเปลี่ยนแปลงนี้เป็นส่วนหนึ่งของ Transaction

    await session.commitTransaction();
    res.status(200).json({ message: "Round started successfully. Assets and caddy are now in use.", booking });//

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

// --- แคดดี้ "เปรียนสถานะเป็นว่างพร้อมรถและถุงกอล์ฟ" (Cancel Before Start) ---
export const markCaddyAsAvailable = async (req, res) => {
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