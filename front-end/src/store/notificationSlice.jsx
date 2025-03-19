import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  unreadChats: {}
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
    }
  }
});
export const { setUnreadChat, markChatAsRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
