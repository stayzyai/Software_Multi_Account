import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  accounts: [], // Multiple Hostaway accounts
  primaryAccountId: null, // ID of the primary account
};

const hostawayUserSlice = createSlice({
  name: "hostawayUser",
  initialState,
  reducers: {
    setHostawayUsers: (state, action) => {
      state.users = action.payload;
    },
    setHostawayAccounts: (state, action) => {
      state.accounts = action.payload;
      // Set primary account ID if not already set
      if (!state.primaryAccountId && action.payload.length > 0) {
        const primaryAccount = action.payload.find(acc => acc.is_primary);
        state.primaryAccountId = primaryAccount ? primaryAccount.id : action.payload[0].id;
      }
    },
    setPrimaryAccount: (state, action) => {
      state.primaryAccountId = action.payload;
    },
    addHostawayAccount: (state, action) => {
      state.accounts.push(action.payload);
    },
    removeHostawayAccount: (state, action) => {
      state.accounts = state.accounts.filter(acc => acc.id !== action.payload);
      // If we removed the primary account, set a new one
      if (state.primaryAccountId === action.payload) {
        state.primaryAccountId = state.accounts.length > 0 ? state.accounts[0].id : null;
      }
    },
    updateHostawayAccount: (state, action) => {
      const { id, updates } = action.payload;
      const accountIndex = state.accounts.findIndex(acc => acc.id === id);
      if (accountIndex !== -1) {
        state.accounts[accountIndex] = { ...state.accounts[accountIndex], ...updates };
      }
    },
  },
});

export const { 
  setHostawayUsers, 
  setHostawayAccounts, 
  setPrimaryAccount, 
  addHostawayAccount, 
  removeHostawayAccount, 
  updateHostawayAccount 
} = hostawayUserSlice.actions;
export default hostawayUserSlice.reducer;
