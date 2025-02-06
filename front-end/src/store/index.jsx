import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import conversationReducer from "./conversationSlice";
import listingReducer from "./listingSlice";
import reservationReducer from "./reservationSlice";
import messagesReducer from "./messagesSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    conversation: conversationReducer,
    listings: listingReducer,
    reservations: reservationReducer,
    messages: messagesReducer,
  },
});

export default store;
