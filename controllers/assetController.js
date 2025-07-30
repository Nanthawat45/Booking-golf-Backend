import Asset from '../models/Asset.js';

// ฟังก์ชันช่วยเหลือ: เปลี่ยนสถานะ Asset ทั่วไป (ใช้ภายใน controller นี้)
// **ฟังก์ชันนี้จะทำหน้าที่เป็น Helper สำหรับ setAssetInUse, setAssetClean, setAssetAvailable**
// export const updateSpecificAssetStatus = async (assetId, currentStatus, nextStatus, res) => {
//     try {
//         const asset = await Asset.findById(assetId);

//         if (!asset) {
//             return res.status(404).json({ message: "Asset not found." });
//         }

//         // ตรวจสอบว่า Asset อยู่ในสถานะที่ถูกต้องก่อนเปลี่ยนหรือไม่
//         if (asset.status !== currentStatus) {
//             return res.status(400).json({ 
//                 message: `Asset '${asset.name}' is not in '${currentStatus}' status. Current status: '${asset.status}'. Cannot change to '${nextStatus}'.` 
//             });
//         }

//         asset.status = nextStatus;
//         await asset.save();

//         res.status(200).json({ 
//             message: `Asset '${asset.name}' status updated from '${currentStatus}' to '${nextStatus}'.`, 
//             asset 
//         });

//     } catch (error) {
//         console.error(`Error updating asset status to ${nextStatus}:`, error);
//         res.status(500).json({ error: error.message || "Failed to update asset status." });
//     }
// };


// --- ✅ ฟังก์ชันหลักสำหรับจัดการ Asset (CRUD ทั่วไป) ---

// สร้าง Asset ใหม่ (เวอร์ชันที่รับ name และ type) req user ส่งมา res เซิร์ฟเวอร์ส่งกลับ
export const createAsset = async (req, res) => { 
    try {
        const { name, type, assetId, description } = req.body; //รับbody 
        // ตรวจสอบว่ามี name และ type หรือไม่
        if (!name || !assetId || !type) { //เซ็กว่ามีค่าไหม
            return res.status(400).json({ message: 'Please provide name, assetId, and type for the asset.' });
        }
        const asset = new Asset({ name, assetId, type, description });//สร้าง Asset ใหม่
        await asset.save(); //เซิฟเวอร์บันทึก Asset ลงฐานข้อมูล
        res.status(201).json(asset); //ส่งกลับ Asset ที่สร้างขึ้นให้ยูสเซอร์
    } catch (error) {
        if (error.code === 11000) {
            if (error.keyValue && error.keyValue.name) {
                 return res.status(409).json({ message: `Asset with name '${req.body.name}' already exists.` });
            }
            if (error.keyValue && error.keyValue.assetId) {
                 return res.status(409).json({ message: `Asset with ID '${req.body.assetId}' already exists.` });
            }
            return res.status(409).json({ message: "Duplicate key error." }); 
        }
        res.status(400).json({ message: error.message });
    }
};


// ดึง Asset ทั้งหมด (ใช้ getAllAssets เพื่อความชัดเจนและคงเส้นคงวา)
export const getAllAssets = async (req, res) => {
    try {
        const assets = await Asset.find({});
        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ดึง Asset ด้วย ID
export const getAssetById = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.status(200).json(asset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// อัปเดตข้อมูล Asset (รวมถึง status แบบอิสระ ถ้ามีสิทธิ์)
export const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        // ไม่มี location ใน req.body แล้ว
        const { name, assetId, type, status, description } = req.body; 
        
        const asset = await Asset.findById(id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });

        const userRole = req.user.role; 
        if (userRole !== 'admin' && userRole !== 'staff') {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to update assets directly.' });
        }

        // อัปเดตเฉพาะฟิลด์ที่มีใน req.body
        if (name) asset.name = name; 
        if (assetId) asset.assetId = assetId;
        if (type) asset.type = type; 
        // if (location) asset.location = location; // <<-- บรรทัดนี้ถูกลบออก
        if (description) asset.description = description;

        if (status) {
            const allowedStatuses = ['booked', 'inUse', 'clean', 'available', 'spare', 'broken']; 
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ message: `Invalid status: ${status}. Allowed statuses are: ${allowedStatuses.join(', ')}` });
            }
            asset.status = status;
        }

        const updatedAsset = await asset.save();
        res.status(200).json(updatedAsset);
    } catch (error) {
        if (error.code === 11000) {
            if (error.keyValue && error.keyValue.name) {
                 return res.status(409).json({ message: `Asset with name '${req.body.name}' already exists.` });
            }
            if (error.keyValue && error.keyValue.assetId) {
                 return res.status(409).json({ message: `Asset with ID '${req.body.assetId}' already exists.` });
            }
            return res.status(409).json({ message: "Duplicate key error." });
        }
        res.status(400).json({ message: error.message });
    }
};

// ลบ Asset
export const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        await asset.deleteOne();
        res.status(200).json({ message: 'Asset removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// --- ✅ ฟังก์ชันสำหรับอัปเดตสถานะ Asset ตาม Flow (ใช้ Logic switch case) ---
// **นี่คือฟังก์ชันที่ใช้แทน 'updateAssetStatus' ตัวเก่าที่มี switch case**
// และจะถูกเรียกจาก route ที่มี :newStatus ใน URL

export const updateAssetStatus = async (req, res) => {
    const { id, newStatus } = req.params; 
    const { description } = req.body; 

    const allowedStatuses = ['booked', 'inUse', 'clean', 'available', 'spare', 'broken'];
    if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ message: `Invalid status: ${newStatus}. Allowed statuses are: ${allowedStatuses.join(', ')}` });
    }

    try {
        const asset = await Asset.findById(id);
        if (!asset) {
            return res.status(404).json({ message: "Asset not found." });
        }
         console.log("Asset before save:", asset);
        const userRole = req.user.role; 
        let message = `Asset '${asset.name}' (${asset.type}) status updated from '${asset.status}' to '${newStatus}'.`;

        // --- A. Logic การตรวจสอบสิทธิ์และการเปลี่ยนสถานะตามบทบาท ---
        if (userRole === 'caddy') {
            if (asset.status === 'inUse' && newStatus === 'broken') {
                if (!description) { 
                    return res.status(400).json({ message: 'Description is required when reporting a broken asset.' });
                }
                asset.status = newStatus;
                asset.description = description; 
                // TODO: ส่ง Notification ไปยัง Starter
                // if (sendNotification) sendNotification('starter', `Caddy ${req.user.name} แจ้งรถกอล์ฟ ${asset.name} (ID: ${asset.assetId}) เสีย. ปัญหา: ${description}`);
            } else {
                return res.status(403).json({ message: `Forbidden: Caddies can only change asset status from 'inUse' to 'broken'.` });
            }
        } else if (userRole === 'starter' || userRole === 'admin' || userRole === 'staff') {
            // Starter, Admin, Staff มีสิทธิ์จัดการสถานะที่ยืดหยุ่นกว่า
            if (description) asset.description = description;

            // <<< ตรงนี้คือจุดที่ต้องแน่ใจว่า switch statement อยู่ในบล็อกนี้ >>>
            switch (asset.status) {
                case 'booked': 
                    if (newStatus === 'inUse' || newStatus === 'broken' || newStatus === 'available' || newStatus === 'spare') { 
                        asset.status = newStatus;
                    } else {
                        return res.status(400).json({ message: `Asset status cannot be changed from 'booked' to '${newStatus}'.` });
                    }
                    break;
                case 'inUse': 
                    if (newStatus === 'clean' || newStatus === 'broken') { 
                        asset.status = newStatus;
                    } else {
                        return res.status(400).json({ message: `Asset status cannot be changed from 'inUse' to '${newStatus}'.` });
                    }
                    break;
                case 'clean': 
                    if (newStatus === 'available' || newStatus === 'spare' || newStatus === 'broken') { 
                        asset.status = newStatus;
                    } else {
                        return res.status(400).json({ message: `Asset status cannot be changed from 'clean' to '${newStatus}'. Only 'available', 'spare', or 'broken' is allowed.` });
                    }
                    break;
                case 'broken': 
                    if (newStatus === 'clean' || newStatus === 'available' || newStatus === 'spare') {
                        asset.status = newStatus;
                        if (newStatus === 'available' || newStatus === 'clean') asset.description = ''; 
                        // TODO: ส่ง Notification ถ้ากลับมาใช้งานได้
                        // if (sendNotification) sendNotification('operations', `รถกอล์ฟ ${asset.name} (ID: ${asset.assetId}) ได้รับการซ่อมแซมและพร้อมใช้งาน (${newStatus}) แล้ว.`);
                    } else {
                        return res.status(400).json({ message: `Asset status cannot be changed from 'broken' to '${newStatus}'. Only 'clean', 'available' or 'spare' is allowed.` });
                    }
                    break;
                case 'available': 
                    if (newStatus === 'spare' || newStatus === 'booked' || newStatus === 'broken') { 
                        asset.status = newStatus;
                    } else {
                        return res.status(400).json({ message: `Asset status cannot be changed from 'available' to '${newStatus}'. Only 'spare', 'booked', or 'broken' is allowed.` });
                    }
                    break;
                case 'spare': 
                    if (newStatus === 'available' || newStatus === 'broken' || newStatus === 'booked' || newStatus === 'inUse') {
                        asset.status = newStatus;
                    } else {
                        return res.status(400).json({ message: `Asset status cannot be changed from 'spare' to '${newStatus}'.` });
                    }
                    break;
                default:
                    asset.status = newStatus;
                    break;
            }
        } else {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to update asset status.' });
        }
        // --- สิ้นสุด A. Logic การตรวจสอบสิทธิ์และการเปลี่ยนสถานะ ---

        const updatedAsset = await asset.save();
        res.status(200).json({ message, asset: updatedAsset });

    } catch (error) {
        console.error(`Error updating asset status for ${id}:`, error);
        res.status(500).json({ error: error.message || "Failed to update asset status." });
    }
};


// --- ✅ ฟังก์ชันสำหรับดึงสรุปสถานะ Asset ทั้งหมด ---

export const getAssetOverallStatus = async (req, res) => {
    try {
        const assetStatuses = await Asset.aggregate([
            {
                $group: {
                    _id: { type: "$type", status: "$status" },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    type: "$_id.type",
                    status: "$_id.status",
                    count: 1
                }
            }
        ]);

        const golfCartSummary = {
            booked: 0,
            inUse: 0,
            clean: 0,
            available: 0,
            spare: 0,
            broken: 0
        };
        const golfBagSummary = {
            booked: 0,
            inUse: 0,
            clean: 0,
            available: 0,
            spare: 0,
            broken: 0
        };

        assetStatuses.forEach(item => {
            if (item.type === 'golfCart') {
                golfCartSummary[item.status] = item.count;
            } else if (item.type === 'golfBag') {
                golfBagSummary[item.status] = item.count;
            }
        });

        res.status(200).json({
            golfCart: golfCartSummary,
            golfBag: golfBagSummary
        });

    } catch (error) {
        console.error("Error fetching asset overall status:", error);
        res.status(500).json({ error: error.message || "Failed to fetch asset overall status." });
    }
};