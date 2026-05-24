import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/axios';
import { updateUserStorage } from './authSlice';

const initialState = {
  files: [],
  folders: [],
  currentFolder: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Upload file
export const uploadFile = createAsyncThunk(
  'files/upload',
  async (formData, thunkAPI) => {
    try {
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.storageUsed !== undefined) {
        thunkAPI.dispatch(updateUserStorage(response.data.storageUsed));
        try {
          const userObj = JSON.parse(localStorage.getItem('user'));
          if (userObj) {
            userObj.storageUsed = response.data.storageUsed;
            localStorage.setItem('user', JSON.stringify(userObj));
          }
        } catch (e) {
          console.error('Failed to update localStorage', e);
        }
      }
      return response.data.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.error) ||
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get files
export const getFiles = createAsyncThunk(
  'files/getAll',
  async ({ folderId, search, isStarred, isTrashed, tag } = {}, thunkAPI) => {
    try {
      let url = '/files?';
      if (folderId) url += `folderId=${folderId}&`;
      if (search) url += `search=${search}&`;
      if (isStarred) url += `isStarred=${isStarred}&`;
      if (isTrashed) url += `isTrashed=${isTrashed}&`;
      if (tag) url += `tag=${tag}&`;
      
      const response = await api.get(url);
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

// Delete file
export const deleteFile = createAsyncThunk(
  'files/delete',
  async (id, thunkAPI) => {
    try {
      const response = await api.delete(`/files/${id}`);
      if (response.data.storageUsed !== undefined) {
        thunkAPI.dispatch(updateUserStorage(response.data.storageUsed));
        try {
          const userObj = JSON.parse(localStorage.getItem('user'));
          if (userObj) {
            userObj.storageUsed = response.data.storageUsed;
            localStorage.setItem('user', JSON.stringify(userObj));
          }
        } catch (e) {
          console.error('Failed to update localStorage', e);
        }
      }
      return id;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update file (rename)
export const updateFile = createAsyncThunk(
  'files/update',
  async ({ id, filename }, thunkAPI) => {
    try {
      const response = await api.patch(`/files/${id}`, { filename });
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

// Toggle star file
export const toggleStarFile = createAsyncThunk(
  'files/toggleStar',
  async (id, thunkAPI) => {
    try {
      const response = await api.patch(`/files/${id}/star`);
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

// Restore file
export const restoreFile = createAsyncThunk(
  'files/restore',
  async (id, thunkAPI) => {
    try {
      const response = await api.patch(`/files/${id}/restore`);
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

export const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    reset: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = '';
    },
    setCurrentFolder: (state, action) => {
      state.currentFolder = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.files.unshift(action.payload); // Add to top
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getFiles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.files = action.payload;
      })
      .addCase(getFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter((file) => file._id !== action.payload);
      })
      .addCase(updateFile.fulfilled, (state, action) => {
        const index = state.files.findIndex((file) => file._id === action.payload._id);
        if (index !== -1) {
          state.files[index] = action.payload;
        }
      })
      .addCase(toggleStarFile.fulfilled, (state, action) => {
        const index = state.files.findIndex((file) => file._id === action.payload._id);
        if (index !== -1) {
          state.files[index] = action.payload;
        }
      })
      .addCase(restoreFile.fulfilled, (state, action) => {
        state.files = state.files.filter((file) => file._id !== action.payload._id);
      });
  },
});

export const { reset, setCurrentFolder } = fileSlice.actions;
export default fileSlice.reducer;
