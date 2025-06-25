import express from "express";
import { bookSlot, getBookings, updateBooking, deleteBooking,
        startJobForCaddy, 
            finishJobForCaddy, 
            finishChargingCleaningForCaddy, 
            resetStatusForCaddy
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/book", protect, bookSlot);
router.get("/", protect, getBookings);
router.put("/:id", protect, updateBooking);
router.delete("/:id", protect, deleteBooking);

router.post('/:bookingId/start',protect, startJobForCaddy);
router.post('/:bookingId/finish',protect, finishJobForCaddy);
router.post('/:bookingId/chargeDone',protect, finishChargingCleaningForCaddy);
router.post('/:bookingId/reset',protect, resetStatusForCaddy);
export default router;
