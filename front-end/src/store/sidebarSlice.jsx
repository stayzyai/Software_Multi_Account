import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isHostawayModel: false,
  iconToggle: false,
  isOpen: false
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    setHostawayModal: (state, action) => {
      state.isHostawayModel = action.payload;
    },
    setIconToggle: (state, action) => {
      state.iconToggle = action.payload;
    },
    setOpenModal: (state, action) => {
      state.isOpen = action.payload;
    },
  },
});

export const { setHostawayModal, setIconToggle, setOpenModal } = sidebarSlice.actions;
export default sidebarSlice.reducer;
