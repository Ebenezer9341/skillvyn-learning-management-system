import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Audit log must be associated with a user"]
    },
    userRole: {
        type: String,
        required: [true, "User role is required for filtering"],
        enum: ["candidate", "mentor", "admin", "superuser"]
    },
    action: {
        type: String,
        required: [true, "Action is required"],
        enum: ["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "ACCESS", "ENROLL", "RATE", "ARCHIVE", "RESTORE", "EMAIL_VERIFIED", "VERIFICATION_SENT", "PASSWORD_RESET", "WARNING", "SECURITY"],
        uppercase: true
    },
    resource: {
        type: String,
        required: [true, "Resource type is required"],
        enum: ["USER", "COURSE", "BUNDLE", "SYSTEM", "PROFILE", "PROFILE_AVATAR", "PROFILE_COVER", "BATCH", "ASSESSMENT", "FORUM"],
        uppercase: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    }
}, { timestamps: true });

// Indexing for faster queries (highly recommended for logs)
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
