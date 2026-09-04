import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Ye middleware check karega ki request ke saath valid token aaya hai ya nahi
export const protect = async (req, res, next) => {
  let token;

  // Token "Authorization: Bearer <token>" header mein aata hai
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Password field chhod ke user ki info request mein daal do
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User nahi mila, token invalid" });
      }

      next(); // sab sahi hai, aage badho
    } catch (error) {
      return res.status(401).json({ message: "Token invalid ya expire ho gaya" });
    }
  } else {
    res.status(401).json({ message: "Token nahi mila, login karo pehle" });
  }
};