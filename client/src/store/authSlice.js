import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/axios';

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user'));

const initialState = {
  user: user ? user : null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Google Login user
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (token, thunkAPI) => {
    try {
      const response = await api.post('/auth/google', { token });
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.data));
        return response.data.data;
      } else {
         return thunkAPI.rejectWithValue(response.data.message);
      }
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
  localStorage.removeItem('user');
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    updateUserStorage: (state, action) => {
      if (state.user) {
        state.user.storageUsed = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { reset, updateUserStorage } = authSlice.actions;
export default authSlice.reducer;
