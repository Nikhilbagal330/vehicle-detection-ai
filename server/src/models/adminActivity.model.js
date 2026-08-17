const mongoose = require("mongoose");

const adminActivitySchema = new mongoose.Schema(
    {
        violationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Violation",
            required: true,
            index: true
        },

        action: {
            type: String,
            required: true,
            enum: [
                "VERIFIED",
                "REJECTED",
                "PLATE_UPDATED"
            ]
        },

        performedBy: {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            },
            name: {
                type: String,
                default: null
            },
            email: {
                type: String,
                default: null
            }
        },

        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        note: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

adminActivitySchema.index({
    createdAt: -1
});

module.exports = mongoose.model(
    "AdminActivity",
    adminActivitySchema
);
