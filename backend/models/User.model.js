import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: [true, "Date of birth is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 6,
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ["candidate", "mentor", "admin", "superuser"],
        default: "candidate"
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, "Bio cannot exceed 500 characters"]
    },
    phone: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    specialty: {
        type: String, // Mostly for Mentors
        trim: true
    },
    avatar: {
        type: String,
        default: ""
    },
    cover: {
        type: String,
        default: ""
    },
    socialLinks: {
        linkedin: String,
        twitter: String,
        github: String,
        portfolio: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notificationSettings: {
        emailAlerts: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        courseUpdates: { type: Boolean, default: true },
        marketingEmails: { type: Boolean, default: false }
    },
    refreshToken: {
        type: String,
        select: false
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Instance method to check password
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
