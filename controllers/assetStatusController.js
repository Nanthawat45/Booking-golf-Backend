import Asset from '../models/Asset.js';

// --- ฟังก์ชันช่วยเหลือ: เปลี่ยนสถานะ Asset ทั่วไป ---
// currentStatus: สถานะปัจจุบันที่ Asset 'ควรจะ' เป็นก่อนเปลี่ยน
// nextStatus: สถานะใหม่ที่ต้องการเปลี่ยนไป
const updateAssetStatus = async (assetId, currentStatus, nextStatus, res) => {
  try {
    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({ message: "Asset not found." });
    }

    // ตรวจสอบว่า Asset อยู่ในสถานะที่ถูกต้องก่อนเปลี่ยนหรือไม่
    if (asset.status !== currentStatus) {
      return res.status(400).json({ 
        message: `Asset '${assetId}' is not in '${currentStatus}' status. Current status: '${asset.status}'. Cannot change to '${nextStatus}'.` 
      });
    }

    asset.status = nextStatus;
    await asset.save();

    res.status(200).json({ 
      message: `Asset '${assetId}' status updated from '${currentStatus}' to '${nextStatus}'.`, 
      asset 
    });

  } catch (error) {
    console.error(`Error updating asset status to ${nextStatus}:`, error);
    res.status(500).json({ error: error.message || "Failed to update asset status." });
  }
};

// --- Controllers สำหรับการเปลี่ยนสถานะ Asset ตามลำดับ ---

// เปลี่ยนจาก "booked" ไป "inUse"
// เช่น: PUT /api/assets/:assetId/inUse
export const setAssetInUse = async (req, res) => {
  const { assetId } = req.params; 
  await updateAssetStatus(assetId, "booked", "inUse", res);
};

// เปลี่ยนจาก "inUse" ไป "clean"
// เช่น: PUT /api/assets/:assetId/clean
export const setAssetClean = async (req, res) => {
  const { assetId } = req.params;
  await updateAssetStatus(assetId, "inUse", "clean", res);
};

// เปลี่ยนจาก "clean" ไป "available"
// เช่น: PUT /api/assets/:assetId/available
export const setAssetAvailable = async (req, res) => {
  const { assetId } = req.params;
  await updateAssetStatus(assetId, "clean", "available", res);
};

// --- Controllers สำหรับสถานะพิเศษ (สามารถเปลี่ยนได้จากหลายสถานะ) ---

// เปลี่ยนสถานะเป็น "spare"
// เช่น: PUT /api/assets/:assetId/spare
export const setAssetSpare = async (req, res) => {
    const { assetId } = req.params;
    try {
        const asset = await Asset.findByIdAndUpdate(assetId, { status: "spare" }, { new: true });
        if (!asset) return res.status(404).json({ message: "Asset not found." });
        res.status(200).json({ message: `Asset '${assetId}' marked as 'spare'.`, asset });
    } catch (error) {
        res.status(500).json({ error: error.message || "Failed to set asset as spare." });
    }
};

// เปลี่ยนสถานะเป็น "broken"
// เช่น: PUT /api/assets/:assetId/broken
export const setAssetBroken = async (req, res) => {
    const { assetId } = req.params;
    try {
        const asset = await Asset.findByIdAndUpdate(assetId, { status: "broken" }, { new: true });
        if (!asset) return res.status(404).json({ message: "Asset not found." });
        res.status(200).json({ message: `Asset '${assetId}' marked as 'broken'.`, asset });
    } catch (error) {
        res.status(500).json({ error: error.message || "Failed to set asset as broken." });
    }
};

// Controller สำหรับสร้าง Asset ใหม่ (คุณอาจจะย้ายไปไฟล์อื่นถ้าต้องการแยก Admin API)
export const createAsset = async (req, res) => {
  try {
    const { type } = req.body; // ไม่ต้องส่ง name แล้ว
    const newAsset = new Asset({ type });
    const savedAsset = await newAsset.save();
    res.status(201).json({ message: "Asset created successfully", asset: savedAsset });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to create asset." });
  }
};

// Controller สำหรับดู Asset ทั้งหมด (คุณอาจจะย้ายไปไฟล์อื่นถ้าต้องการแยก Admin API)
export const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find({});
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch assets." });
  }
};

