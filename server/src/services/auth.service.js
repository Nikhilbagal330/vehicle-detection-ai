const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");


const createToken = (user) => {

    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            name: user.name
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

};


const formatUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email
});


const signup = async ({
    name,
    email,
    password
}) => {

    if (!name || !email || !password) {
        const error = new Error(
            "Name, email, and password are required"
        );
        error.statusCode = 400;
        throw error;
    }

    if (password.length < 6) {
        const error = new Error(
            "Password must be at least 6 characters"
        );
        error.statusCode = 400;
        throw error;
    }

    const existingUser = await User.findOne({
        email: email.toLowerCase().trim()
    });

    if (existingUser) {
        const error = new Error(
            "Email already registered"
        );
        error.statusCode = 409;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(
        password,
        10
    );

    const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword
    });

    const token = createToken(user);

    return {
        token,
        user: formatUser(user)
    };

};


const login = async ({
    email,
    password
}) => {

    if (!email || !password) {
        const error = new Error(
            "Email and password are required"
        );
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findOne({
        email: email.toLowerCase().trim()
    });

    if (!user) {
        const error = new Error(
            "Invalid email or password"
        );
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!isMatch) {
        const error = new Error(
            "Invalid email or password"
        );
        error.statusCode = 401;
        throw error;
    }

    const token = createToken(user);

    return {
        token,
        user: formatUser(user)
    };

};


module.exports = {
    signup,
    login
};
