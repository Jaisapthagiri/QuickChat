import jwt from 'jsonwebtoken'
import User from '../models/User.js';

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.token || req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Token not found" });
    }

    // Handle Bearer token if needed
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

