import { createSlice } from "@reduxjs/toolkit";

const messagesSlice = createSlice({
  name: "messages",
  initialState: [],
  reducers: {
    setMessages: (state, action) => {
      const { id, message } = action.payload;
      const existingConversation = state.find(conv => conv.id === id);
      if (existingConversation) {
        existingConversation.messages = message;
      } else {
        state.push({ id, messages: message });
      }
    },
  },
});

export const { setMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
