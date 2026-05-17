import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/axios';

const initialState = {
  sharedFiles: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const getSharedFiles = createAsyncThunk(
  'share/getSharedFiles',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/share/shared-with-me');
      return response.data.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const shareFile = createAsyncThunk(
  'share/shareFile',
  async ({ fileId, email, permission }, thunkAPI) => {
    try {
      const response = await api.post(`/share/${fileId}`, { email, permission });
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const shareSlice = createSlice({
  name: 'share',
  initialState,
  reducers: {
    reset: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSharedFiles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSharedFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.sharedFiles = action.payload;
      })
      .addCase(getSharedFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = shareSlice.actions;
export default shareSlice.reducer;
