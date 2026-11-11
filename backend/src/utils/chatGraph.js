import { ChatGroq } from "@langchain/groq";
import {
  StateGraph,
  START,
  END,
  MessagesAnnotation,
} from "@langchain/langgraph";
import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
  // other params...
});

const client = new MongoClient(process.env.MONGODB_URI);
const checkpointer = new MongoDBSaver({ client, dbName: "langgraph" });

const chatNode = async (state) => {
  const recentMessages = state.messages.slice(-4);

  const response = await llm.invoke(recentMessages);

  return {
    messages: [response],
  };
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("chatNode", chatNode)
  .addEdge(START, "chatNode")
  .addEdge("chatNode", END);

const chatGraph = workflow.compile({ checkpointer });

export default chatGraph;
