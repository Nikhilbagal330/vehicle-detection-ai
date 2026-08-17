const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema(
    {
        cameraId: {
            type: String,
            required: true
        },

        zoneId: {
            type: String,
            required: true
        },

        vehicleId: {
            type: Number,
            required: true
        },

        plateNumber: {
            type: String,
            required: true,
            trim: true
        },

        violationType: {
            type: String,
            required: true,
            default: "NO_PARKING"
        },

        vehicleType: {
            type: String,
            default: "car"
        },

        duration: {
            type: Number,
            required: true
        },

        ocrConfidence: {
            type: Number,
            default: null
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "VERIFIED",
                "REJECTED"
            ],
            default: "PENDING"
        },

        evidence: {
            plateImage: {
                type: String,
                default: null
            },

            vehicleImage: {
                type: String,
                default: null
            },

            fullImage: {
                type: String,
                default: null
            }
        },

        detectedAt: {
            type: Date,
            required: true
        },

        verifiedAt: {
            type: Date,
            default: null
        },

        verifiedBy: {
            type: String,
            default: null
        },

        rejectionReason: {
            type: String,
            default: null
        }
    },

    {
        timestamps: true
    }
);


violationSchema.index(
    {
        cameraId: 1,
        zoneId: 1,
        vehicleId: 1,
        plateNumber: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "Violation",
    violationSchema
);