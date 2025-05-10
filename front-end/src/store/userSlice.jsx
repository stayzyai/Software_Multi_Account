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
    image_url: null
  },
  reducers: {
    setUser: (state, action) => {
      const { id, firstname, lastname, email, role, ai_enable, chat_list, image_url } =
        action.payload;
      state.id = id;
      state.firstname = firstname;
      state.lastname = lastname;
      state.email = email;
      state.role = role;
      state.ai_enable = ai_enable;
      state.chat_list = chat_list,
      state.image_url = image_url
    },
    clearUser: (state) => {
      state.id = null;
      state.firstname = null;
      state.lastname = null;
      state.email = null;
      state.role = null;
      state.ai_enable = null;
      state.chat_list=[]
      state.image_url = null
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
