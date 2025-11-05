import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userId: null,
  username: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.userId = action.payload.userId;
      state.username = action.payload.username;
    },
    logout(state) {
      state.userId = null;
      state.username = null;
    }
  }
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
