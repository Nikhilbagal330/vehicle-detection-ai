const authService = require(
    "../services/auth.service"
);


const signup = async (req, res) => {

    try {

        const result = await authService.signup(
            req.body
        );

        return res.status(201).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "Signup error:",
            error.message
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Failed to create account"
        });

    }

};


const login = async (req, res) => {

    try {

        const result = await authService.login(
            req.body
        );

        return res.json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "Login error:",
            error.message
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Failed to login"
        });

    }

};


module.exports = {
    signup,
    login
};
