import jwt from 'jsonwebtoken';
import { User } from '../models/model.user.js'; // Assuming this model exists for fetching user data

// Authentication middleware
export const isAuthenticated = async (req, res, next) => {
    try {
        // Get token from cookies
        const token = req.cookies.jwt || req.headers.authorization?.split(" ")[1]; // Support for token in header (Bearer token)

        console.log("Middleware: "+token)
        console.log("Jwt secret key: "+process.env.JWT_SECRET_KEY)
        // Check if token exists
        if (!token) {
           
            return res.status(401).json({ message: "User not authenticated, please login" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log("JWT_DETAILS: "+decoded);

        // Find the user by ID in the token
        req.user = await User.findById(decoded.userId); // Ensure the User model exists and has a method to find by ID

        if (!req.user) {
            return res.status(401).json({ message: "User not found, please login" });
        }

        // User is authenticated, proceed to the next middleware
        next();
    } catch (error) {
        console.error("Error in Authentication: ", error);
        return res.status(401).json({ message: "Invalid or expired token, please login again" });
    }
};

// Authorization middleware for roles
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // req.user.role must be populated by the isAuthenticated middleware
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user.role}) is not authorized to access this resource` });
        }
        next();
    };
};



