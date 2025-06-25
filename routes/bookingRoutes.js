import express from "express";
import { bookSlot, getBookings, updateBooking, deleteBooking } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/book", protect, bookSlot);
router.get("/", protect, getBookings);
router.put("/:id", protect, updateBooking);
router.delete("/:id", protect, deleteBooking);
export default router;
