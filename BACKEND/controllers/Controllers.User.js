import { User } from '../models/model.user.js'; // Import the User model
import cloudinary from 'cloudinary'; // Import Cloudinary for file uploads
import bcrypt from "bcrypt";
import createTokenAndSaveCookies from '../jwt/AuthToken.js'; // Import token creation logic

// Register a new user
export const register = async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "User photo is required" });
    }

    const { photo } = req.files;
    const allowedFormats = ["image/jpg", "image/jpeg", "image/png"];

    // Check if the uploaded file format is allowed
    if (!allowedFormats.includes(photo.mimetype)) {
      return res.status(400).json({ message: "Invalid photo format. Only jpg and png are allowed." });
    }

    const { name, email, password, phone, education, role } = req.body;

    // Check if any required fields are missing
    if (!name || !email || !password || !phone || !education || !role) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered with this email." });
    }

    // Upload photo to Cloudinary
    const cloudinaryResponse = await cloudinary.v2.uploader.upload(photo.tempFilePath);

    // Handle potential errors from Cloudinary
    if (!cloudinaryResponse || cloudinaryResponse.error) {
      return res.status(500).json({ message: "Error uploading photo." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      education,
      role,
      photo: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url
      }
    });

    await newUser.save();

    if (newUser) {
      // Create and save token in cookies
      const token = await createTokenAndSaveCookies(newUser._id, res);
      return res.status(201).json({ message: "User registered successfully", newUser, token });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
};

// Login a user
export const login = async (req, res) => {
  const { role, email, password } = req.body;

  try {
    // Check for missing fields
    if (!role || !email || !password) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    // Find user by email and select password
    const user = await User.findOne({ email }).select("password role name email _id");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Check if the role matches
    if (user.role !== role) {
      return res.status(400).json({ message: `Role ${role} does not match.` });
    }

    // Create and save token in cookies
    const token = await createTokenAndSaveCookies(user._id, res);
    return res.status(200).json({
      message: "User logged in successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

// Logout a user
export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: "strict",
    });

    return res.status(200).json({ message: "User logged out successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

// Get user profile
export const getMyProfile = async (req, res) => {
  try {
    const user = req.user; // Assuming middleware handles setting req.user
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve profile." });
  }
};

// Get all admins
export const getAllAdmin = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' });
    return res.status(200).json(admins);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve admins." });
  }
};
