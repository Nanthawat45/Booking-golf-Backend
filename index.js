import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import mongoose from 'mongoose';

dotenv.config();
const DB_URL = process.env.DB_URL;

const app = express();
try {
    mongoose.connect(DB_URL);
    console.log("Connect to Mongo DB Successfully");
  } catch (error) {
    console.log("DB Connection Failed");
  }
  
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
