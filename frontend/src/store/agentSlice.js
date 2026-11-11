import { createSlice } from "@reduxjs/toolkit";

const agentSlice = createSlice({
  name: "agent",
  initialState: {
    agents: [],
    selectedAgent: "",
  },
  reducers: {
    setAgents: (state, action) => {
      state.agents = action.payload ?? [];
    },
    setSelectedAgent: (state, action) => {
      state.selectedAgent = action.payload;
    },
  },
});

export const { setAgents, setSelectedAgent } = agentSlice.actions;
export default agentSlice.reducer;
