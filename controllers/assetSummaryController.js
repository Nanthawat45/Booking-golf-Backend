import Asset from '../models/Asset.js'; // ตรวจสอบเส้นทางนี้ให้ถูกต้อง

// สร้าง Asset ใหม่
export const createAsset = async (req, res) => {
    try {
        const { name, type } = req.body;
        const asset = new Asset({ name, type });
        await asset.save();
        res.status(201).json(asset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ดึง Asset ทั้งหมด
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

// อัปเดตข้อมูล Asset
export const updateAsset = async (req, res) => {
    try {
        const { name, type, status } = req.body;
        const asset = await Asset.findById(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });

        asset.name = name || asset.name;
        asset.type = type || asset.type;
        asset.status = status || asset.status;

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

// Controller สำหรับอัปเดตสถานะ Asset
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

// ดึงสรุปสถานะ Asset ทั้งหมด (golfCart และ golfBag)
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