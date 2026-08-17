const violationService = require(
    "../services/violation.service"
);

const activityService = require(
    "../services/activity.service"
);


const createViolation = async (
    req,
    res
) => {

    try {

        const violation =
            await violationService.createViolation(
                req.body
            );

        return res.status(201).json({
            success: true,
            data: violation
        });

    } catch (error) {

        console.error(
            "Create violation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create violation"
        });
    }
};


const getViolations = async (
    req,
    res
) => {

    try {

        const {
            page,
            limit,
            status,
            from,
            to,
            cameraId,
            zoneId,
            vehicleType,
            plateNumber
        } = req.query;

        const result =
            await violationService.getViolations({
                page,
                limit,
                status,
                from,
                to,
                cameraId,
                zoneId,
                vehicleType,
                plateNumber
            });

        return res.json({
            success: true,
            data: result.violations,
            pagination: result.pagination,
            stats: result.stats,
            facets: result.facets
        });

    } catch (error) {

        console.error(
            "Get violations error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch violations"
        });
    }
};


const getViolationById = async (
    req,
    res
) => {

    try {

        const violation =
            await violationService.getViolationById(
                req.params.id
            );

        if (!violation) {

            return res.status(404).json({
                success: false,
                message: "Violation not found"
            });
        }

        return res.json({
            success: true,
            data: violation
        });

    } catch (error) {

        console.error(
            "Get violation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch violation"
        });
    }
};


const updateViolationStatus = async (
    req,
    res
) => {

    try {

        const {
            status,
            verifiedBy,
            rejectionReason
        } = req.body;

        if (
            ![
                "VERIFIED",
                "REJECTED"
            ].includes(status)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Status must be VERIFIED or REJECTED"
            });
        }

        const violation =
            await violationService.updateViolationStatus(
                req.params.id,
                status,
                verifiedBy,
                rejectionReason,
                req.user
            );

        if (!violation) {

            return res.status(404).json({
                success: false,
                message: "Violation not found"
            });
        }

        return res.json({
            success: true,
            data: violation
        });

    } catch (error) {

        console.error(
            "Update violation status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update violation"
        });
    }
};


const updatePlateNumber = async (
    req,
    res
) => {

    try {

        const {
            plateNumber
        } = req.body;

        const violation =
            await violationService.updatePlateNumber(
                req.params.id,
                plateNumber,
                req.user
            );

        if (!violation) {

            return res.status(404).json({
                success: false,
                message: "Violation not found"
            });
        }

        return res.json({
            success: true,
            data: violation
        });

    } catch (error) {

        console.error(
            "Update plate number error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Failed to update plate number"
        });
    }
};


const getStatsTimeline = async (
    req,
    res
) => {

    try {

        const range = req.query.range || "7d";

        const timeline =
            await violationService.getStatsTimeline(
                range
            );

        return res.json({
            success: true,
            data: timeline
        });

    } catch (error) {

        console.error(
            "Get stats timeline error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch statistics"
        });
    }
};


const getViolationActivities = async (
    req,
    res
) => {

    try {

        const activities =
            await activityService.getActivitiesByViolationId(
                req.params.id
            );

        return res.json({
            success: true,
            data: activities
        });

    } catch (error) {

        console.error(
            "Get violation activities error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch activities"
        });
    }
};


module.exports = {
    createViolation,
    getViolations,
    getViolationById,
    updateViolationStatus,
    updatePlateNumber,
    getStatsTimeline,
    getViolationActivities
};
