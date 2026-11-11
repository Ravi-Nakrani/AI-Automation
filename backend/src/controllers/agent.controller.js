import Agent from "../models/agent.model.js";

export const createAgent = async (req, res) => {
  try {
    const { name, knowledgeBase, instructions, tools } = req.body;
    if (!name || !knowledgeBase || !instructions) {
      return res.status(400).json({
        message: "Name, knowledge base, and instructions are required",
      });
    }

    const newAgent = await Agent.create({
      userId: req.user.id,
      name,
      knowledgeBase,
      instructions,
      tools,
    });
    return res.status(201).json(newAgent);
  } catch (error) {
    console.error("Error creating agent:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find({ userId: req.user.id });

    return res.status(200).json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    return res.status(200).json(agent);
  } catch (error) {
    console.error("Error fetching agent:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAgent = async (req, res) => {
  try {
    await Agent.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Agent deleted successfully" });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
