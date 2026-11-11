import express from "express";
import { authCheck } from "../middleware/authCheck.js";
import { agentChat, chat } from "../controllers/chat.controller.js";

const chatRouter = express.Router();

chatRouter.post("/", authCheck, chat);
chatRouter.post("/agent", authCheck, agentChat);

export default chatRouter;
