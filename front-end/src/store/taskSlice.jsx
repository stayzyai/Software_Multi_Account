import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tasks: [],
  issueStaus: {}
};

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks: (state, action) => {
      state.tasks = action.payload;
    },
    setIssueStatus: (state, action) => {    
      state.issueStaus = action.payload;
    }
  },
});

export const { setTasks, setIssueStatus } = taskSlice.actions;
export default taskSlice.reducer;
