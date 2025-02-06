import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    setConversations(state, action) {
      state.conversations = action.payload;
    },
    clearConversations(state) {
      state.conversations = [];
    },
  },
});

export const { setConversations, clearConversations } = conversationSlice.actions;
export default conversationSlice.reducer;
