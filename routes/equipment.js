import express from "express";
import { 
    addEquipment, 
    seedEquipment, 
    updateEquipment, 
    getEquipmentStatus
    
    } from "../controllers/equipment.js";
const router = express.Router();

router.post("/add", addEquipment);
router.post("/seed", seedEquipment);
router.put("/update", updateEquipment);
router.get("/status", getEquipmentStatus);



export default router;
