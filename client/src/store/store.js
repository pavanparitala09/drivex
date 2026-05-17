import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import fileReducer from './fileSlice';
import folderReducer from './folderSlice';
import shareReducer from './shareSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: fileReducer,
    folders: folderReducer,
    share: shareReducer,
  },
});
