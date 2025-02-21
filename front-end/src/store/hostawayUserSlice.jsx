import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
};

const hostawayUserSlice = createSlice({
  name: "hostawayUsers",
  initialState,
  reducers: {
    setHostawayUsers: (state, action) => {
      state.users = action.payload;
    },
  },
});

export const { setHostawayUsers } = hostawayUserSlice.actions;
export default hostawayUserSlice.reducer;
