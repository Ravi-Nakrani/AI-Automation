import express from "express";
import { login, logout, profile } from "../controllers/auth.controller.js";
import { authCheck } from "../middleware/authCheck.js";

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/profile", authCheck, profile);

export default authRouter;
