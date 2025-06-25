import Booking from "../models/Booking.js";
import Equipment from "../models/Equipment.js";

// 🔹 จองเวลาออกรอบ
export const bookSlot = async (req, res) => {
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

    const testUserId = "64a7e2f1234567890abcdef0";
    
    const cart = await Equipment.findOne({ name: "golfCart" });
    const bag = await Equipment.findOne({ name: "golfBag" });

    if (!cart || !bag) {
      return res.status(500).json({ message: "Equipment not found" });
    }

    if (cart.available < golfCartQty || bag.available < golfBagQty) {
      return res.status(400).json({ message: "Not enough equipment available" });
    }

    cart.available -= golfCartQty;
    bag.available -= golfBagQty;
    await cart.save();
    await bag.save();

    const booking = new Booking({
      user: testUserId,
      courseType,
      date,
      timeSlot,
      players,
      groupName,
      caddy,
      totalPrice,
      isPaid: false,
      golfCartQty,
      golfBagQty,
    });

    await booking.save();
    res.status(201).json({ message: "Booking Successful", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 🔹 ดึงรายการจองของผู้ใช้
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ตรวจสอบว่า user เป็นเจ้าของการจอง
    // if (booking.user.toString() !== req.user._id.toString()) {
    //   return res.status(401).json({ message: "Not authorized to update this booking" });
    // }

    // อัปเดตเฉพาะ timeSlot เท่านั้น
    if (req.body.timeSlot) {
      booking.timeSlot = req.body.timeSlot;
    } else {
      return res.status(400).json({ message: "Only 'timeSlot' can be updated" });
    }

    const updatedBooking = await booking.save();

    res.status(200).json({ message: "Booking time updated successfully", booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    // ถ้าอยากลบเฉพาะเจ้าของ booking ให้เปิดเช็คนี้ไว้
    // if (booking.user.toString() !== req.user._id.toString()) {
    //   return res.status(401).json({ message: "Not authorized to delete this booking" });
    // }
  
    await booking.deleteOne();

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};







// เริ่มงาน
export const startJobForCaddy = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const caddyId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // if (booking.caddy.toString() !== caddyId) {
    //   return res.status(403).json({ message: "Not authorized" });
    // }

    if (booking.golfCartStatus !== "booked" || booking.golfBagStatus !== "booked") {
      return res.status(400).json({ message: "Invalid status to start job" });
    }

    booking.golfCartStatus = "inUse";
    booking.golfBagStatus = "inUse";

    await booking.save();
    res.json({ message: "Job started" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// จบงาน
export const finishJobForCaddy = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const caddyId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // if (booking.caddy.toString() !== caddyId) {
    //   return res.status(403).json({ message: "Not authorized" });
    // }

    if (booking.golfCartStatus !== "inUse" || booking.golfBagStatus !== "inUse") {
      return res.status(400).json({ message: "Invalid status to finish job" });
    }

    booking.golfCartStatus = "charging";
    booking.golfBagStatus = "cleaning";

    await booking.save();
    res.json({ message: "Job finished" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// เปลี่ยนแบต / ทำความสะอาดเสร็จ
export const finishChargingCleaningForCaddy = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const caddyId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // if (booking.caddy.toString() !== caddyId) {
    //   return res.status(403).json({ message: "Not authorized" });
    // }

    if (booking.golfCartStatus !== "charging" || booking.golfBagStatus !== "cleaning") {
      return res.status(400).json({ message: "Invalid status to finish charging/cleaning" });
    }

    booking.golfCartStatus = "available";
    booking.golfBagStatus = "available";

    await booking.save();
    res.json({ message: "Equipment ready and available" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// รีเซ็ตสถานะ (ถ้าต้องการ)
export const resetStatusForCaddy = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const caddyId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // if (booking.caddy.toString() !== caddyId) {
    //   return res.status(403).json({ message: "Not authorized" });
    // }

    booking.golfCartStatus = "available";
    booking.golfBagStatus = "available";

    await booking.save();
    res.json({ message: "Status reset to available" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};