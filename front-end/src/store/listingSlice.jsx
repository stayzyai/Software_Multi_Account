import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    listings: [],
};

const listingslice = createSlice({
  name: "listings",
  initialState,
  reducers: {
    setListings(state, action) {
      state.listings = action.payload;
    },
    clearlistings(state) {
      state.listings = [];
    },
  },
});

export const { setListings, clearlistings } = listingslice.actions;
export default listingslice.reducer;
