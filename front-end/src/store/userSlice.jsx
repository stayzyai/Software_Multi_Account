import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    id: null,
    firstname: null,
    lastname: null,
    email: null,
    role: null,
    ai_enable: null,
    chat_list:[],
    image_url: null,
    property_ai_status: {}, // { propertyId: { ai_enabled: boolean, last_updated: timestamp } }
    master_ai_enabled: true, // Master AI toggle - controls all AI functionality
    timezone: "America/Chicago" // Default timezone - fallback to Central Time
  },
  reducers: {
    setUser: (state, action) => {
      const { id, firstname, lastname, email, role, ai_enable, chat_list, image_url, property_ai_status, master_ai_enabled, timezone } =
        action.payload;
      state.id = id;
      state.firstname = firstname;
      state.lastname = lastname;
      state.email = email;
      state.role = role;
      state.ai_enable = ai_enable;
      state.chat_list = chat_list,
      state.image_url = image_url;
      state.property_ai_status = property_ai_status || {};
      state.master_ai_enabled = master_ai_enabled !== undefined ? master_ai_enabled : true;
      state.timezone = timezone || "America/Chicago";
    },
    clearUser: (state) => {
      state.id = null;
      state.firstname = null;
      state.lastname = null;
      state.email = null;
      state.role = null;
      state.ai_enable = null;
      state.chat_list=[]
      state.image_url = null;
      state.property_ai_status = {};
      state.master_ai_enabled = true;
      state.timezone = "America/Chicago";
    },
    updatePropertyAIStatus: (state, action) => {
      const { propertyId, ai_enabled } = action.payload;
      state.property_ai_status[propertyId] = {
        ai_enabled,
        last_updated: Date.now()
      };
    },
    updateMasterAIStatus: (state, action) => {
      state.master_ai_enabled = action.payload;
    },
    updateUserTimezone: (state, action) => {
      state.timezone = action.payload;
    },
  },
});

export const { setUser, clearUser, updatePropertyAIStatus, updateMasterAIStatus, updateUserTimezone } = userSlice.actions;
export default userSlice.reducer;
