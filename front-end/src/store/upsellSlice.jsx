import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  upsell: [],
};

const upsellSlice = createSlice({
  name: "upsell",
  initialState,
  reducers: {
    setUpsellOffer: (state, action) => {
      state.upsell = action.payload;
    },
  },
});

export const { setUpsellOffer } = upsellSlice.actions;
export default upsellSlice.reducer;
