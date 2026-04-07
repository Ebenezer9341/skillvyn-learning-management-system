import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import User from "./models/User.model.js";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function updateUsers() {
    try {
        const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/skillvyn";
        console.log("Connecting to:", mongoUrl);
        await mongoose.connect(mongoUrl);
        const res = await User.updateMany({}, { $set: { isEmailVerified: true } });
        console.log("Migrated existing users to isEmailVerified: true ->", res.modifiedCount);
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
updateUsers();
