import jwt from 'jsonwebtoken';
import { User } from '../models/model.user.js'; // Ensure the correct file extension

const createTokenAndSaveCookies = async (userId, res) => {
  // Create JWT token
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d"
  });

  // Set JWT token in cookies
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: "strict"
  });

  // Update user with the token
  await User.findByIdAndUpdate(userId, { token });

  return token;
}

export default createTokenAndSaveCookies;
