import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  unreadChats: {},
  issueStaus: {},
  issueId: null,
  isSuggestion: false
};
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadChat: (state, action) => {
      // Add chat ID to unreadChats
      state.unreadChats[action.payload.chatId] = true;
    },
    markChatAsRead: (state, action) => {
      // Mark a chat as read (set to false)
      state.unreadChats[action.payload.chatId] = false;
    },
    setIssueStatus: (state, action) => {    
      state.issueStaus = action.payload;
    },
    setTaskId: (state, action)=>{
      state.issueId = action.payload
    },
    setSuggestion: (state, action)=>{
      state.isSuggestion = action.payload
    }
  }
});
export const { setUnreadChat, markChatAsRead, setIssueStatus, setTaskId, setSuggestion } = notificationsSlice.actions;
export default notificationsSlice.reducer;
