import Equipment from "../models/Equipment.js";

export const seedEquipment = async () => {
  try {
    // ล้างของเก่าทิ้งก่อน
    await Equipment.deleteMany();

    // เพิ่มอุปกรณ์ใหม่
    const result = await Equipment.insertMany([
      { name: "golfCart", total: 49, available: 49 },
      { name: "golfBag", total: 40, available: 40 },
    ]);

    console.log(" Equipment seeded:", result);
  } catch (error) {
    console.error(" Failed to seed equipment:", error.message);
    throw error;
  }
};

export const addEquipment = async (req, res) => {
  try {
    const { name, total } = req.body;
    if (!["golfCart", "golfBag"].includes(name)) {
      return res.status(400).json({ message: "Invalid equipment name" });
    }

    // เช็คว่ามีอุปกรณ์ชื่อนี้อยู่แล้วไหม
    const exist = await Equipment.findOne({ name });
    if (exist) {
      return res.status(400).json({ message: "Equipment already exists" });
    }

    const newEquip = new Equipment({
      name,
      total,
      available: total,
    });
    await newEquip.save();
    res.status(201).json({ message: "Equipment added", equipment: newEquip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEquipment = async (req, res) => {
  try {
    const { name, total } = req.body;
    const equipment = await Equipment.findOne({ name });
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    equipment.total = total;
    // ปรับ available ตาม total (เช่นถ้าลดจำนวนต้องระวังไม่ให้ available ติดลบ)
    if (equipment.available > total) {
      equipment.available = total;
    }

    await equipment.save();
    res.json({ message: "Equipment updated", equipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 รายงานสถานะอุปกรณ์
export const getEquipmentStatus = async (req, res) => {
  try {
    const equipmentList = await Equipment.find();

    // คำนวณสถานะการใช้งานของแต่ละชิ้น
    const statusReport = equipmentList.map((equip) => ({
      name: equip.name,
      total: equip.total,
      available: equip.available,
      inUse: equip.total - equip.available, // ใช้งานอยู่
    }));

    res.json({ equipmentStatus: statusReport });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




/////////////ไม่ชัวร์ว่าใช่ไหม


