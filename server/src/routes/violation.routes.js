const express = require("express");

const {
    createViolation,
    getViolations,
    getViolationById,
    updateViolationStatus,
    updatePlateNumber,
    getStatsTimeline,
    getViolationActivities
} = require(
    "../controllers/violation.controller"
);

const authMiddleware = require(
    "../middleware/auth.middleware"
);

const router = express.Router();


router.post(
    "/",
    createViolation
);


router.get(
    "/",
    authMiddleware,
    getViolations
);


router.get(
    "/stats/timeline",
    authMiddleware,
    getStatsTimeline
);


router.get(
    "/:id/activities",
    authMiddleware,
    getViolationActivities
);


router.get(
    "/:id",
    authMiddleware,
    getViolationById
);


router.patch(
    "/:id/status",
    authMiddleware,
    updateViolationStatus
);


router.patch(
    "/:id/plate",
    authMiddleware,
    updatePlateNumber
);


module.exports = router;
