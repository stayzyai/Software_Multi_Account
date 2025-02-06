import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  reservations: [],
};

const reservationSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {
    setReservations: (state, action) => {
      state.reservations = action.payload;
    },
  },
});

export const { setReservations, setStatus } = reservationSlice.actions;

export default reservationSlice.reducer;
