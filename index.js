import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import equipment from "./routes/equipment.js";
import mongoose from 'mongoose';
import { setupSwagger } from "./swagger.js";
import cookieParser from "cookie-parser";

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
app.use(cookieParser());

app.use("/api/user", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/item", equipment);

setupSwagger(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
