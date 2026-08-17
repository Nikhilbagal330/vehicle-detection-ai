const Violation = require("../models/violation.model");
const activityService = require("./activity.service");


const createViolation = async (data) => {

    const violation = await Violation.create(data);

    return violation;
};


const escapeRegex = (value) =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


const buildFilter = ({
    status,
    from,
    to,
    cameraId,
    zoneId,
    vehicleType,
    plateNumber
}) => {

    const filter = {};

    if (
        status &&
        status !== "ALL" &&
        [
            "PENDING",
            "VERIFIED",
            "REJECTED"
        ].includes(status)
    ) {
        filter.status = status;
    }

    if (cameraId && String(cameraId).trim()) {
        filter.cameraId = new RegExp(
            escapeRegex(String(cameraId).trim()),
            "i"
        );
    }

    if (zoneId && String(zoneId).trim()) {
        filter.zoneId = new RegExp(
            escapeRegex(String(zoneId).trim()),
            "i"
        );
    }

    if (vehicleType && String(vehicleType).trim()) {
        filter.vehicleType = new RegExp(
            `^${escapeRegex(String(vehicleType).trim())}$`,
            "i"
        );
    }

    if (plateNumber && String(plateNumber).trim()) {
        filter.plateNumber = new RegExp(
            escapeRegex(String(plateNumber).trim()),
            "i"
        );
    }

    if (from || to) {

        filter.detectedAt = {};

        if (from) {
            const fromDate = new Date(from);
            fromDate.setHours(0, 0, 0, 0);
            filter.detectedAt.$gte = fromDate;
        }

        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            filter.detectedAt.$lte = toDate;
        }
    }

    return filter;
};


const getViolations = async ({
    page = 1,
    limit = 10,
    status,
    from,
    to,
    cameraId,
    zoneId,
    vehicleType,
    plateNumber
} = {}) => {

    const safePage = Math.max(
        1,
        Number(page) || 1
    );

    const safeLimit = Math.min(
        100,
        Math.max(
            1,
            Number(limit) || 10
        )
    );

    const filter = buildFilter({
        status,
        from,
        to,
        cameraId,
        zoneId,
        vehicleType,
        plateNumber
    });

    const statsFilter = buildFilter({
        from,
        to,
        cameraId,
        zoneId,
        vehicleType,
        plateNumber
    });

    const skip = (safePage - 1) * safeLimit;

    const [
        violations,
        total,
        pending,
        verified,
        rejected,
        cameras,
        zones,
        vehicleTypes
    ] = await Promise.all([
        Violation
            .find(filter)
            .sort({
                detectedAt: -1
            })
            .skip(skip)
            .limit(safeLimit),

        Violation.countDocuments(filter),

        Violation.countDocuments({
            ...statsFilter,
            status: "PENDING"
        }),

        Violation.countDocuments({
            ...statsFilter,
            status: "VERIFIED"
        }),

        Violation.countDocuments({
            ...statsFilter,
            status: "REJECTED"
        }),

        Violation.distinct("cameraId"),
        Violation.distinct("zoneId"),
        Violation.distinct("vehicleType")
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(total / safeLimit)
    );

    return {
        violations,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages
        },
        stats: {
            total:
                pending + verified + rejected,
            pending,
            verified,
            rejected
        },
        facets: {
            cameras: cameras.filter(Boolean).sort(),
            zones: zones.filter(Boolean).sort(),
            vehicleTypes: vehicleTypes.filter(Boolean).sort()
        }
    };
};


const getViolationById = async (id) => {

    return Violation.findById(id);
};


const updateViolationStatus = async (
    id,
    status,
    verifiedBy,
    rejectionReason,
    actor = {}
) => {

    const existing = await Violation.findById(id);

    if (!existing) {
        return null;
    }

    const update = {
        status
    };

    const actorLabel =
        verifiedBy ||
        actor.name ||
        actor.email ||
        null;

    if (status === "VERIFIED") {

        update.verifiedAt = new Date();

        update.verifiedBy = actorLabel;
    }

    if (status === "REJECTED") {

        update.verifiedAt = new Date();

        update.verifiedBy = actorLabel;

        update.rejectionReason =
            rejectionReason || null;
    }

    const violation = await Violation.findByIdAndUpdate(
        id,
        update,
        {
            returnDocument: "after"
        }
    );

    await activityService.logActivity({
        violationId: id,
        action: status,
        actor,
        details: {
            previousStatus: existing.status,
            newStatus: status,
            plateNumber: violation.plateNumber
        },
        note: rejectionReason || null
    });

    return violation;
};


const updatePlateNumber = async (
    id,
    plateNumber,
    actor = {}
) => {

    const cleaned = String(plateNumber || "")
        .trim()
        .toUpperCase();

    if (!cleaned) {
        const error = new Error(
            "Plate number is required"
        );
        error.statusCode = 400;
        throw error;
    }

    const existing = await Violation.findById(id);

    if (!existing) {
        return null;
    }

    const previousPlate = existing.plateNumber;

    const violation = await Violation.findByIdAndUpdate(
        id,
        {
            plateNumber: cleaned
        },
        {
            returnDocument: "after"
        }
    );

    if (previousPlate !== cleaned) {

        await activityService.logActivity({
            violationId: id,
            action: "PLATE_UPDATED",
            actor,
            details: {
                previousPlate,
                newPlate: cleaned
            }
        });
    }

    return violation;
};


const RANGE_CONFIG = {
    "1d": {
        days: 1,
        bucket: "hour",
        label: "Last 24 hours"
    },
    "7d": {
        days: 7,
        bucket: "day",
        label: "Last 7 days"
    },
    "1m": {
        days: 30,
        bucket: "day",
        label: "Last 1 month"
    },
    "3m": {
        days: 90,
        bucket: "day",
        label: "Last 3 months"
    },
    "6m": {
        days: 180,
        bucket: "day",
        label: "Last 6 months"
    }
};


const pad = (value) => String(value).padStart(2, "0");


const formatBucketKey = (date, bucket) => {

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());

    if (bucket === "hour") {
        return `${year}-${month}-${day} ${pad(date.getHours())}:00`;
    }

    return `${year}-${month}-${day}`;
};


const buildEmptySeries = (
    fromDate,
    toDate,
    bucket
) => {

    const series = [];
    const cursor = new Date(fromDate);

    if (bucket === "hour") {
        cursor.setMinutes(0, 0, 0);
    } else {
        cursor.setHours(0, 0, 0, 0);
    }

    const end = new Date(toDate);

    while (cursor <= end) {

        series.push({
            date: formatBucketKey(cursor, bucket),
            total: 0,
            pending: 0,
            verified: 0,
            rejected: 0
        });

        if (bucket === "hour") {
            cursor.setHours(cursor.getHours() + 1);
        } else {
            cursor.setDate(cursor.getDate() + 1);
        }
    }

    return series;
};


const getStatsTimeline = async (rangeKey = "7d") => {

    const config =
        RANGE_CONFIG[rangeKey] || RANGE_CONFIG["7d"];

    const toDate = new Date();
    const fromDate = new Date(toDate);

    fromDate.setTime(
        toDate.getTime() -
            config.days * 24 * 60 * 60 * 1000
    );

    const dateFormat =
        config.bucket === "hour"
            ? "%Y-%m-%d %H:00"
            : "%Y-%m-%d";

    const rows = await Violation.aggregate([
        {
            $match: {
                detectedAt: {
                    $gte: fromDate,
                    $lte: toDate
                }
            }
        },
        {
            $group: {
                _id: {
                    date: {
                        $dateToString: {
                            format: dateFormat,
                            date: "$detectedAt",
                            timezone: "Asia/Kolkata"
                        }
                    },
                    status: "$status"
                },
                count: {
                    $sum: 1
                }
            }
        }
    ]);

    const seriesMap = new Map(
        buildEmptySeries(
            fromDate,
            toDate,
            config.bucket
        ).map((item) => [item.date, item])
    );

    rows.forEach((row) => {

        const key = row._id.date;
        const point = seriesMap.get(key);

        if (!point) {
            return;
        }

        const status = String(row._id.status || "")
            .toLowerCase();

        point.total += row.count;

        if (status === "pending") {
            point.pending += row.count;
        } else if (status === "verified") {
            point.verified += row.count;
        } else if (status === "rejected") {
            point.rejected += row.count;
        }
    });

    return {
        range: rangeKey in RANGE_CONFIG
            ? rangeKey
            : "7d",
        label: config.label,
        bucket: config.bucket,
        from: fromDate,
        to: toDate,
        series: Array.from(seriesMap.values())
    };
};


module.exports = {
    createViolation,
    getViolations,
    getViolationById,
    updateViolationStatus,
    updatePlateNumber,
    getStatsTimeline
};
