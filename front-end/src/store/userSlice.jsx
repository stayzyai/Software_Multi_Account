import { createSlice } from "@reduxjs/toolkit";


const userSlice = createSlice({
  name: "user",
  initialState: {
    id:null,
    firstname: null,
    lastname: null,
    email: null,
    role: null,
  },
  reducers: {
    setUser: (state, action) => {
      const {id, firstname, lastname, email, role } = action.payload;
      state.id = id;
      state.firstname = firstname;
      state.lastname = lastname;
      state.email = email;
      state.role = role;
    },
    clearUser: (state) => {
      state.id = null;
      state.firstname = null;
      state.lastname = null;
      state.email = null;
      state.role = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
