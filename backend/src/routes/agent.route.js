import express from "express";
import { authCheck } from "../middleware/authCheck.js";
import {
  createAgent,
  deleteAgent,
  getAgentById,
  getAllAgents,
} from "../controllers/agent.controller.js";

const agentRouter = express.Router();

agentRouter.post("/", authCheck, createAgent);
agentRouter.get("/", authCheck, getAllAgents);
agentRouter.get("/:id", authCheck, getAgentById);
agentRouter.delete("/:id", authCheck, deleteAgent);

export default agentRouter;
