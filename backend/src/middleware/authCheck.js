import { verifyToken } from "../utils/jwt.js";

export const authCheck = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid token." });
  }

  req.user = decoded;
  next();
};
