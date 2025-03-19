import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
};

const hostawayUserSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setHostawayUsers: (state, action) => {
      state.users = action.payload;
    },
  },
});

export const { setHostawayUsers } = hostawayUserSlice.actions;
export default hostawayUserSlice.reducer;
