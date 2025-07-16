import Asset from '../models/Asset.js';

// ฟังก์ชันช่วยเหลือ: เปลี่ยนสถานะ Asset ทั่วไป (ใช้ภายใน controller นี้)
// **ฟังก์ชันนี้จะทำหน้าที่เป็น Helper สำหรับ setAssetInUse, setAssetClean, setAssetAvailable**
const updateSpecificAssetStatus = async (assetId, currentStatus, nextStatus, res) => {
    try {
        const asset = await Asset.findById(assetId);

        if (!asset) {
            return res.status(404).json({ message: "Asset not found." });
        }

        // ตรวจสอบว่า Asset อยู่ในสถานะที่ถูกต้องก่อนเปลี่ยนหรือไม่
        if (asset.status !== currentStatus) {
            return res.status(400).json({ 
                message: `Asset '${asset.name}' is not in '${currentStatus}' status. Current status: '${asset.status}'. Cannot change to '${nextStatus}'.` 
            });
        }

        asset.status = nextStatus;
        await asset.save();

        res.status(200).json({ 
            message: `Asset '${asset.name}' status updated from '${currentStatus}' to '${nextStatus}'.`, 
            asset 
        });

    } catch (error) {
        console.error(`Error updating asset status to ${nextStatus}:`, error);
        res.status(500).json({ error: error.message || "Failed to update asset status." });
    }
};


// --- ✅ ฟังก์ชันหลักสำหรับจัดการ Asset (CRUD ทั่วไป) ---

// สร้าง Asset ใหม่ (เวอร์ชันที่รับ name และ type)
export const createAsset = async (req, res) => {
    try {
        const { name, type } = req.body;
        // ตรวจสอบว่ามี name และ type หรือไม่
        if (!type) {
            return res.status(400).json({ message: 'Please provide both name and type for the asset.' });
        }
        const asset = new Asset({ name, type });
        await asset.save();
        res.status(201).json(asset);
    } catch (error) {
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
        const { name, type, status } = req.body;
        const asset = await Asset.findById(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });

        asset.name = name || asset.name;
        asset.type = type || asset.type;
        // การอัปเดต status ผ่านฟังก์ชันนี้จะไม่มี Logic switch case
        // เหมาะสำหรับ Admin ที่ต้องการแก้ไขสถานะโดยตรง (เช่นแก้ไขข้อมูลย้อนหลัง)
        if (status) {
            const allowedStatuses = ['available', 'inUse', 'clean', 'broken', 'spare', 'booked'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ message: `Invalid status: ${status}. Allowed statuses are: ${allowedStatuses.join(', ')}` });
            }
            asset.status = status;
        }

        const updatedAsset = await asset.save();
        res.status(200).json(updatedAsset);
    } catch (error) {
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
    const { id } = req.params; 
    const { newStatus } = req.params; 

    const allowedStatuses = ['available', 'inUse', 'clean', 'broken', 'spare', 'booked'];
    if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ message: `Invalid status: ${newStatus}. Allowed statuses are: ${allowedStatuses.join(', ')}` });
    }

    try {
        const asset = await Asset.findById(id);

        if (!asset) {
            return res.status(404).json({ message: "Asset not found." });
        }

        let message = `Asset '${asset.name}' (${asset.type}) status updated from '${asset.status}' to '${newStatus}'.`;

        switch (asset.status) {
            case 'booked': 
                if (newStatus === 'inUse') {
                    asset.status = newStatus;
                } else {
                    return res.status(400).json({ message: `Asset status cannot be changed from 'booked' to '${newStatus}'. Only 'inUse' is allowed.` });
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
                if (newStatus === 'available' || newStatus === 'spare') {
                    asset.status = newStatus;
                } else {
                    return res.status(400).json({ message: `Asset status cannot be changed from 'clean' to '${newStatus}'. Only 'available' or 'spare' is allowed.` });
                }
                break;
            case 'broken': 
                if (newStatus === 'clean' || newStatus === 'spare') {
                    asset.status = newStatus;
                } else {
                    return res.status(400).json({ message: `Asset status cannot be changed from 'broken' to '${newStatus}'. Only 'clean' or 'spare' is allowed.` });
                }
                break;
            default: 
                asset.status = newStatus;
                break;
        }

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