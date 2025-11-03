import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';  
import {leadReducer} from './leadReducer';

const store = configureStore({
  reducer: {
    user: userReducer,
    leadState: leadReducer,

  },
});


export default store;
