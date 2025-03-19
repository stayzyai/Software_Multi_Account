import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import conversationReducer from "./conversationSlice";
import listingReducer from "./listingSlice";
import reservationReducer from "./reservationSlice";
import messagesReducer from "./messagesSlice";
import sidebarReducer from "./sidebarSlice";
import notificationReducer from "./notificationSlice"
import reservationsReducer from "./taskSlice"
import hostawayUserReducer from "./hostawayUserSlice"
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import upsellReducer from "./upsellSlice"

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
    notifications: persistedNotificationReducer,
    tasks: reservationsReducer, 
    hostawayUser: hostawayUserReducer,
    upsells: upsellReducer
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
