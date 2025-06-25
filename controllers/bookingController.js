import Booking from "../models/Booking.js";

// 🔹 จองเวลาออกรอบ
export const bookSlot = async (req, res) => {
  try {
    const { courseType, date, timeSlot, players, groupName, caddy, totalPrice } = req.body;
    const testUserId = "64a7e2f1234567890abcdef0";
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