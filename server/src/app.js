const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require(
    "./routes/auth.routes"
);

const violationRoutes = require(
    "./routes/violation.routes"
);

const app = express();

// Serve detector evidence from the Python folder only
const EVIDENCE_DIR = path.resolve(
    __dirname,
    "../../python/evidence"
);


app.use(cors());

app.use(
    express.json()
);

app.use(
    "/evidence",
    express.static(EVIDENCE_DIR)
);


app.get(
    "/health",
    (req, res) => {

        res.json({
            success: true,
            message: "Backend is running"
        });

    }
);


app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/violations",
    violationRoutes
);


module.exports = app;
