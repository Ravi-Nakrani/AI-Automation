import { getAuth } from "firebase-admin/auth";
import app from "../config/firebase.js";
import User from "../models/user.model.js";
import { generateToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ message: "Firebase token is required" });
    }

    const decodedToken = await getAuth(app).verifyIdToken(firebaseToken);
    const user = await User.findOneAndUpdate(
      { firebaseUid: decodedToken.uid },
      {
        $set: {
          name: decodedToken.name,
          email: decodedToken.email,
          profilePicture: decodedToken.picture,
        },
        $setOnInsert: {
          firebaseUid: decodedToken.uid,
        },
      },
      { returnDocument: "after", upsert: true },
    );

    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({ message: "Logged out successfully" });
};

export const profile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user info:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
