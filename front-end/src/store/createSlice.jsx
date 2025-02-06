import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  listings: [],
  status: false,
};

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setListings: (state, action) => {
      state.listings = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
  },
});

export const { setListings, setStatus } = listingsSlice.actions;
export default listingsSlice.reducer;
