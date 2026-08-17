const jwt = require("jsonwebtoken");


const authMiddleware = (req, res, next) => {

    try {

        const header = req.headers.authorization;

        if (
            !header ||
            !header.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }

        const token = header.slice(7);

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name || null
        };

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }

};


module.exports = authMiddleware;
