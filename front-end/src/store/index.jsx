import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import conversationReducer from "./conversationSlice";
import listingReducer from "./listingSlice";
import reservationReducer from "./reservationSlice";
import messagesReducer from "./messagesSlice";
import sidebarReducer from "./sidebarSlice";
import notificationReducer from "./notificationSlice"
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";

const userPersistConfig = {
  key: "user",
  storage,
};
const notificationPersistConfig = {
  key: "notifications",
  storage,
};

const persistedUserReducer = persistReducer(userPersistConfig, userReducer);
const persistedNotificationReducer = persistReducer(notificationPersistConfig, notificationReducer);

export const store = configureStore({
  reducer: {
    user: persistedUserReducer,
    conversation: conversationReducer,
    listings: listingReducer,
    reservations: reservationReducer,
    messages: messagesReducer,
    sidebar: sidebarReducer,
    notifications: persistedNotificationReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
