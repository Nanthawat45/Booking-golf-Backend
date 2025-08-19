import Booking from '../models/Booking.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// --- ฟังก์ชันช่วยเหลือสำหรับจอง Asset ตามจำนวน (และส่งคืน ID) ---
const reserveAssets = async (assetType, quantity, session) => {
  if (quantity <= 0) { //ถ้าจำนวนที่ขอจอง (quantity) น้อยกว่าหรือเท่ากับ 0
    return []; // คืนค่า array เป็น null หรือว่าง
  }

  const availableAssets = await Asset.find({ //ใช้โมเดล Asset เพื่อค้นหาข้อมูล
    type: assetType, // กำหนดประเภทของ Asset ที่ต้องการจอง (เช่น golfCart หรือ golfBag)
    status: "available" // เงื่อนไข: สถานะต้องเป็น 'available' เท่านั้น
  }).limit(quantity).session(session); //.limit(quantity) — จำกัดจำนวนผลลัพธ์ที่ได้ไม่เกินจำนวนที่ขอจอง
  //.session(session) — ทำงานใน MongoDB session ที่ส่งเข้ามา (transaction)
  if (availableAssets.length < quantity) { // ถ้าจำนวน Asset ที่ว่างน้อยกว่าที่ขอจอง
    throw new Error(`Not enough ${assetType} available. Requested: ${quantity}, Available: ${availableAssets.length}`);
    // แจ้งข้อผิดพลาดว่าจำนวน Asset ที่ว่างไม่เพียงพอ //throw คือการบอกโปรแกรมว่า "เจอปัญหา หยุดทำงาน 
   // ${assetType} คือการแทรกค่าของ assetType ที่ส่งเข้ามา // ${quantity} คือการแทรกค่าของ quantity ที่ส่งเข้ามา
   //${availableAssets.length} คือการแทรกจำนวน Asset ที่ว่างที่เจอ
  }

  const assetIdsToUpdate = availableAssets.map(asset => asset._id); // สร้างอาเรย์ของ ID ของ Asset ที่จะถูกจอง
  // asset => asset._id คือการเข้าถึง _id ของแต่ละ Asset ในอาเรย์ availableAssets
  await Asset.updateMany( //updateMany() เป็นคำสั่งแก้ไขหลายอย่างพร้อมกัน
    { _id: { $in: assetIdsToUpdate } }, //ค้นหา Asset ที่มี ID อยู่ใน assetIdsToUpdate
    { $set: { status: "booked" } }, //เปลี่ยนสถานะ status เป็น 'booked'
    { session: session } // ใช้ session เพื่อให้คำสั่งนี้เป็นส่วนหนึ่งของ transaction
  );

  return assetIdsToUpdate;// ส่งคืน ID ของ Asset ที่ถูกจองไปแล้ว
};

// --- ฟังก์ชันช่วยเหลือสำหรับจองแคดดี้ ---
const reserveCaddies = async (caddyIds, session) => {
  if (!caddyIds || caddyIds.length === 0) { // ถ้าไม่มีการเลือกแคดดี้ // === 0 คือการเช็คว่า array ว่างหรือไม่ 
    return []; // คืนค่า array เป็น null หรือว่าง
  }

  // ค้นหาแคดดี้ที่ถูกเลือก และต้องมี role เป็น 'caddy' และ status เป็น 'available'
  const availableCaddies = await User.find({ //find() ค้นหาค้นหนข้อมูล { }
    _id: { $in: caddyIds }, // ค้นหาแคดดี้ที่มี ID อยู่ใน caddyIds //$ in ใช้เลือกข้อมูลที่ _id อยู่ใน array
    role: 'caddy',
    caddyStatus: 'available'
  }).session(session); // ใช้ session เพื่อให้คำสั่งนี้เป็นส่วนหนึ่งของ transaction ที่เราต้องการควบคุม 
  // //หมายความว่า ถ้าธุรกรรมถูกยกเลิก (abortTransaction) ทุกคำสั่งที่ใช้ session นี้ก็จะถูกย้อนกลับด้วย 

  // ตรวจสอบว่าแคดดี้ที่เลือกมาทั้งหมดว่างจริงหรือไม่
  if (availableCaddies.length !== caddyIds.length) { //เช็คว่า จำนวนแคดดี้ที่เจอ (ที่ว่างและเป็นแคดดี้จริง ๆ) เท่ากับจำนวนที่ลูกค้าขอจองหรือไม่
    const bookedCaddyIds = availableCaddies.map(caddy => caddy._id.toString()); //bookedCaddyIds คือการแปลง ID ของแคดดี้ที่ว่างให้เป็น string เพื่อเทียบกัน
    const unavailableRequestedCaddyIds = caddyIds.filter(id => !bookedCaddyIds.includes(id.toString())); //ดึง _id ของแคดดี้ที่ยังว่าง และแปลงเป็น string ทั้งหมด เพื่อเอาไปเทียบกับ caddyIds ที่ส่งเข้ามา ว่าคนไหน “ไม่ว่าง”
    // filter ใช้เพื่อกรองข้อมูลที่ไม่ตรงตามเงื่อนไขที่กำหนด // includes() ใช้เพื่อตรวจสอบว่า ID ของแคดดี้ที่ส่งเข้ามาอยู่ใน bookedCaddyIds หรือไม่
    throw new Error(`Some selected caddies are not available or do not exist/are not caddies: ${unavailableRequestedCaddyIds.join(', ')}`);
    // ถ้าไม่ว่างหรือไม่ใช่แคดดี้จริง ๆ ให้ error //throw คือการบอกโปรแกรมว่า "เจอปัญหาแล้ว หยุดทำงานตรงนี้
    //ถ้าไม่มี throw ระบบจะ อัปเดตแคดดี้แม้จะมีบางคนไม่ว่าง  ทำให้ข้อมูลไม่ถูกต้อง
  }

  // เปลี่ยนสถานะของแคดดี้ที่จองแล้วให้เป็น "booked"
  await User.updateMany( //updateMany() เป็นคำสั่งแก้ไขหลายอย่างพร้อมกัน
    { _id: { $in: caddyIds } }, //ค้นหาแคดดี้ที่มี ID อยู่ใน caddyIds //$in ใช้เลือกข้อมูลที่ _id อยู่ใน array
    { $set: { caddyStatus: "booked" } }, //เปลี่ยนสถานะ caddyStatus เป็น "booked"
    { session: session } // ใช้ session เพื่อให้คำสั่งนี้เป็นส่วนหนึ่งของ transaction
  );

  return caddyIds; // ส่งคืน ID ของแคดดี้ที่ถูกจองไปแล้ว
};

// ---  จองเวลาออกรอบ (Book Slot) ---
export const bookSlot = async (req, res) => {
  const session = await mongoose.startSession(); //startSession() เพื่อใช้ commitTransaction() ถ้าผ่าน ไม่ผ่านใช้ abortTransaction()
  session.startTransaction(); // เริ่มต้น session สำหรับการทำธุรกรรม // ทุกการแก้ไขข้อมูลต่อจากนี้จะยังไม่ถาวร จนกว่าจะ commit

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

    const booking = new Booking({ // สร้าง Booking ใหม่
      user: req.user._id, // โมเดล User โดยเก็บ _id ของผู้ใช้
      courseType,
      date,
      timeSlot,
      players,
      groupName,
      caddy: bookedCaddyIds, 
      totalPrice,
      isPaid: false, // ยังไม่ชำระเงิน
      golfCartQty,
      golfBagQty,
      bookedGolfCartIds: bookedGolfCartIds, 
      bookedGolfBagIds: bookedGolfBagIds,
      status: 'pending'   
    });

    await booking.save({ session }); // บันทึกการจองในฐานข้อมูล
    await session.commitTransaction(); // ยืนยันการทำธุรกรรม จะบันทึกถาวร การเปลี่ยนแปลงทั้งหมดใน transaction
    res.status(201).json({ message: "Booking Successful", booking });

  } catch (error) {
    await session.abortTransaction(); // ยกเลิกการทำธุรกรรม ถ้ามีข้อผิดพลาดเกิดขึ้น จะไม่บันทึกการเปลี่ยนแปลงใดๆทั้งหมด
    console.error("Booking failed:", error); // แสดงข้อผิดพลาดใน console
    res.status(400).json({ error: error.message || "Failed to make booking." }); // ส่งข้อความแสดงข้อผิดพลาดกลับไปยังผู้ใช้
  } finally {
    session.endSession(); // ปิด session ไม่ว่าจะสำเร็จหรือไม่
  }
};

// ---  ดึงรายการจองทั้งหมด ---
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find() // รอ ค้นหาทุกการจอง
      .populate('caddy', 'name email caddyStatus') // populate() ใช้เพื่อดึงข้อมูลแคดดี้ที่เกี่ยวข้องกับการจอง
      .populate('bookedGolfCartIds', 'name type status') 
      .populate('bookedGolfBagIds', 'name type status'); 
    res.json(bookings); // ส่งข้อมูลการจองทั้งหมดที่ได้มากลับไปยังผู้เรียกใช้ API ในรูปแบบของ JSON
  } catch (error) {
    res.status(500).json({ error: error.message }); // ส่งข้อความแสดงข้อผิดพลาดกลับไปยังผู้ใช้
  }
};

// ---  อัปเดตรายการจอง (ยังไม่รวมการจัดการแคดดี้ หรือ Asset) ---
export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);// params ใช้ ID ที่ส่งมาใน URL 

    if (!booking) { // ถ้าไม่พบการจองด้วย ID ที่ระบุ
      return res.status(404).json({ message: "Booking not found" }); // ส่งข้อความว่าไม่พบการจอง
    }

    if (req.body.timeSlot) {// ถ้ามีการส่ง timeSlot มาใน body ของ request
      booking.timeSlot = req.body.timeSlot; // อัปเดต timeSlot ของการจอง
    } else {
      return res.status(400).json( 
        { message: "Only 'timeSlot' can be updated for this endpoint" });// ถ้าไม่มี timeSlot ให้ส่งข้อความว่าไม่สามารถอัปเดตได้
    }

    const updatedBooking = await booking.save(); // บันทึกการเปลี่ยนแปลงการจองในฐานข้อมูล

    res.status(200).json({ 
      message: "Booking updated successfully", booking: updatedBooking }); // ส่งข้อความยืนยันการอัปเดตและข้อมูลการจองที่อัปเดตแล้วกลับไปยังผู้ใช้
  } catch (error) {
    res.status(500).json({ error: error.message});// ส่งข้อความแสดงข้อผิดพลาดกลับไปยังผู้ใช้
  }
};

// ---  ลบรายการจอง (Admin/Staff) ---
export const deleteBooking = async (req, res) => {
  const session = await mongoose.startSession(); // เริ่มต้น session สำหรับการทำธุรกรรม
  session.startTransaction(); // เริ่มต้น transaction
  try {
    const booking = await Booking.findById(req.params.id).session(session); // ค้นหาการจองด้วย ID ที่ระบุใน URL
    if (!booking) { // ถ้าไม่พบการจองด้วย ID ที่ระบุ
      return res.status(404).json({ message: "Booking not found" }); // ส่งข้อความว่าไม่พบการจอง
    }
    
    // คืนสถานะ Asset
    if (booking.bookedGolfCartIds.length > 0) { // ถ้ามีการจอง Golf Cart
      await Asset.updateMany( // updateMany() ใช้เพื่ออัปเดตหลายรายการพร้อมกัน
        { _id: { $in: booking.bookedGolfCartIds } }, // ค้นหา Asset ที่มี ID อยู่ใน bookedGolfCartIds
        { $set: { status: "available" } }, // เปลี่ยนสถานะ status เป็น 'available'
        { session: session } // ใช้ session เพื่อให้คำสั่งนี้เป็นส่วนหนึ่งของ transaction
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

    await booking.deleteOne({ session }); // ลบการจองออกจากฐานข้อมูล // deleteOne() ใช้เพื่อลบเอกสารเดียว

    await session.commitTransaction(); // ยืนยันการทำธุรกรรม จะบันทึกถาวร การเปลี่ยนแปลงทั้งหมดใน transaction // commitTransaction() จะทำให้การเปลี่ยนแปลงที่ทำใน session นี้เป็นถาวร
    res.status(200).json({ 
      message: "Booking deleted successfully, assets and caddies returned to available." }); // ส่งข้อความยืนยันการลบการจองและคืนสถานะ Asset และ Caddy กลับไปยังผู้ใช้
  } catch (error) {
    await session.abortTransaction();// ยกเลิกการทำธุรกรรม ถ้ามีข้อผิดพลาดเกิดขึ้น จะไม่บันทึกการเปลี่ยนแปลงใดๆทั้งหมด
    console.error("Error deleting booking:", error); // แสดงข้อผิดพลาดใน console
    res.status(500).json({ error: error.message || "Failed to delete booking." }); // ส่งข้อความแสดงข้อผิดพลาดกลับไปยังผู้ใช้
  } finally { // finally คือบล็อกที่ทำงานเสร็จสิ้นไม่ว่าจะเกิดข้อผิดพลาดหรือไม่
    session.endSession(); // ปิด session ไม่ว่าจะสำเร็จหรือไม่ 
  }
};

// ---  ฟังก์ชัน: แคดดี้เริ่มงาน (Start Round) ---
export const startRound = async (req, res) => {
  const { bookingId } = req.params; // ดึง bookingId จากพารามิเตอร์ของ URL
  const caddyId = req.user._id; // ID ของแคดดี้ที่ล็อกอินอยู่

  const session = await mongoose.startSession(); // เริ่มต้น session สำหรับการทำธุรกรรม
  session.startTransaction(); // เริ่มต้น transaction

  try {
    const booking = await Booking.findById(bookingId).session(session); // ค้นหาการจองด้วย ID ที่ระบุใน bookingId

    if (!booking) {
      return res.status(404).json({
         message: "Booking not found." });// ถ้าไม่พบการจองด้วย ID ที่ระบุ ให้ส่งข้อความว่าไม่พบการจอง
    }

    // ตรวจสอบว่าแคดดี้ที่ล็อกอินอยู่ถูกมอบหมายให้กับการจองนี้หรือไม่
    if (!booking.caddy.map(id => id.toString()).includes(caddyId.toString())) { // booking.caddy: คือ array ของ ID แคดดี้ที่ถูกมอบหมายให้กับการจองนี้
      // .map ใช้แปลงทุก ID ใน array ให้เป็น string เพื่อให้เปรียบเทียบ // includes(caddyId.toString()): ตรวจสอบว่า caddyId ของแคดดี้ที่ล็อกอินอยู่มีอยู่ใน array นี้หรือไม่
        return res.status(403).json({ 
          message: "You are not assigned to this booking." }); // ถ้าไม่ใช่แคดดี้ที่ถูกมอบหมายให้กับการจองนี้ ให้ส่งข้อความว่าไม่ได้รับอนุญาต
    }

    // ตรวจสอบสถานะปัจจุบันของ Asset และ Caddy ก่อนเปลี่ยน
    const currentCaddy = await User.findById(caddyId).session(session); // ค้นหาแคดดี้ที่ล็อกอินอยู่
    if (!currentCaddy || currentCaddy.caddyStatus !== 'booked') { // ถ้าไม่พบแคดดี้ หรือสถานะของแคดดี้ไม่ใช่ 'booked'
      throw new Error("Caddy is not in 'booked' status or not found."); // แจ้งข้อผิดพลาดว่าแคดดี้ไม่อยู่ในสถานะ 'booked' หรือไม่พบ
    }

    // 1. เปลี่ยนสถานะของ Golf Carts จาก 'booked' เป็น 'inUse'
    if (booking.bookedGolfCartIds && booking.bookedGolfCartIds.length > 0) { // ถ้ามีการจอง มากกว่า 0
      const result = await Asset.updateMany(  // updateMany() ใช้เพื่ออัปเดตหลายรายการพร้อมกัน
        { _id: { $in: booking.bookedGolfCartIds }, status: 'booked' }, // ค้นหา Asset ที่มี ID อยู่ใน bookedGolfCartIds และสถานะเป็น booked ไหม
        { $set: { status: 'inUse' } }, // เปลี่ยนสถานะ status เป็น inUse
        { session: session } // ใช้ session เพื่อให้คำสั่งนี้เป็นส่วนหนึ่งของ transaction
      );
      if (result.modifiedCount !== booking.bookedGolfCartIds.length) { // ถ้าจำนวนที่ถูกแก้ไขไม่เท่ากับจำนวนที่จองไว้
          throw new Error("Not all golf carts were in 'booked' status or updated."); // แจ้งข้อผิดพลาดว่าไม่สามารถเปลี่ยนสถานะของรถกอล์ฟทั้งหมดได้
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
    await User.updateOne( // updateOne() ใช้เพื่ออัปเดตครั้งเดียว
      { _id: caddyId, caddyStatus: 'booked' },
      { $set: { caddyStatus: 'onDuty' } },
      { session: session } // ใช้ session เพื่อให้คำสั่งนี้เป็นส่วนหนึ่งของ transaction
    );

    await session.commitTransaction(); // ยืนยันการทำธุรกรรม จะบันทึกถาวร การเปลี่ยนแปลงทั้งหมดใน transaction
    res.status(200).json({ 
      message: "Round started successfully. Assets and caddy are now in use.", booking }); // ส่งข้อความยืนยันการเริ่มงานและข้อมูลการจองกลับไปยังผู้ใช้

  } catch (error) {
    await session.abortTransaction(); // ยกเลิกการทำธุรกรรม ถ้ามีข้อผิดพลาดเกิดขึ้น จะไม่บันทึกการเปลี่ยนแปลงใดๆทั้งหมด
    console.error("Failed to start round:", error);// แสดงข้อผิดพลาดใน console
    res.status(400).json({ error: error.message || "Failed to start round." });// ส่งข้อความแสดงข้อผิดพลาดกลับไปยังผู้ใช้
  } finally {
    session.endSession();// ปิด session ไม่ว่าจะสำเร็จหรือไม่
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

export const getMyAssignedBookings2 = async (req, res) => {
    const caddyId = req.user._id;

    try {
        const bookings = await Booking.find({ 
            caddy: caddyId,
        })
        .select('courseType date timeSlot groupName') // เลือกเฉพาะ field ที่ต้องการ
        .sort({ date: 1, timeSlot: 1 }); // เรียงตามวันที่และเวลา

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "No assigned bookings found." });
        }

        res.status(200).json(bookings);

    } catch (error) {
        console.error("Error fetching caddy's assigned bookings:", error);
        res.status(500).json({ error: error.message || "Failed to fetch assigned bookings." });
    }
};