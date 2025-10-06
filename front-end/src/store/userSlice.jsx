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
    timezone: "America/Chicago", // Default timezone - fallback to Central Time
    ai_schedule: {
      enabled: false, // Whether schedule control is enabled
      days: {
        monday: { enabled: true, startTime: "09:00", endTime: "17:00" },
        tuesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
        wednesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
        thursday: { enabled: true, startTime: "09:00", endTime: "17:00" },
        friday: { enabled: true, startTime: "09:00", endTime: "17:00" },
        saturday: { enabled: false, startTime: "09:00", endTime: "17:00" },
        sunday: { enabled: false, startTime: "09:00", endTime: "17:00" }
      },
      dateRanges: [], // Array of { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", enabled: boolean }
      timezone: "America/Chicago" // Timezone for schedule
    }
  },
  reducers: {
    setUser: (state, action) => {
      const { id, firstname, lastname, email, role, ai_enable, chat_list, image_url, property_ai_status, master_ai_enabled, timezone, ai_schedule } =
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
      // Only update master_ai_enabled if it's explicitly provided in the payload
      // Otherwise, preserve the existing value to prevent unintended resets
      if (master_ai_enabled !== undefined) {
        state.master_ai_enabled = master_ai_enabled;
      }
      state.timezone = timezone || "America/Chicago";
      // Only update ai_schedule if it's explicitly provided in the payload
      if (ai_schedule !== undefined) {
        state.ai_schedule = { ...state.ai_schedule, ...ai_schedule };
      }
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
      state.ai_schedule = {
        enabled: false,
        days: {
          monday: { enabled: true, startTime: "09:00", endTime: "17:00" },
          tuesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
          wednesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
          thursday: { enabled: true, startTime: "09:00", endTime: "17:00" },
          friday: { enabled: true, startTime: "09:00", endTime: "17:00" },
          saturday: { enabled: false, startTime: "09:00", endTime: "17:00" },
          sunday: { enabled: false, startTime: "09:00", endTime: "17:00" }
        },
        dateRanges: [],
        timezone: "America/Chicago"
      };
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
    updateAIScheduleEnabled: (state, action) => {
      state.ai_schedule.enabled = action.payload;
    },
    updateAIScheduleDay: (state, action) => {
      const { day, enabled, startTime, endTime } = action.payload;
      state.ai_schedule.days[day] = {
        enabled: enabled !== undefined ? enabled : state.ai_schedule.days[day].enabled,
        startTime: startTime || state.ai_schedule.days[day].startTime,
        endTime: endTime || state.ai_schedule.days[day].endTime
      };
    },
    updateAIScheduleDateRange: (state, action) => {
      const { index, startDate, endDate, enabled } = action.payload;
      if (index >= 0 && index < state.ai_schedule.dateRanges.length) {
        state.ai_schedule.dateRanges[index] = {
          startDate: startDate || state.ai_schedule.dateRanges[index].startDate,
          endDate: endDate || state.ai_schedule.dateRanges[index].endDate,
          enabled: enabled !== undefined ? enabled : state.ai_schedule.dateRanges[index].enabled
        };
      }
    },
    addAIScheduleDateRange: (state, action) => {
      const { startDate, endDate, enabled = true } = action.payload;
      state.ai_schedule.dateRanges.push({ startDate, endDate, enabled });
    },
    removeAIScheduleDateRange: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.ai_schedule.dateRanges.length) {
        state.ai_schedule.dateRanges.splice(index, 1);
      }
    },
  },
});

export const { 
  setUser, 
  clearUser, 
  updatePropertyAIStatus, 
  updateMasterAIStatus, 
  updateUserTimezone,
  updateAIScheduleEnabled,
  updateAIScheduleDay,
  updateAIScheduleDateRange,
  addAIScheduleDateRange,
  removeAIScheduleDateRange
} = userSlice.actions;
export default userSlice.reducer;
