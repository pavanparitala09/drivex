import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/axios';

const initialState = {
  folders: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Create folder
export const createFolder = createAsyncThunk(
  'folders/create',
  async (folderData, thunkAPI) => {
    try {
      const response = await api.post('/folders', folderData);
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

// Get folders
export const getFolders = createAsyncThunk(
  'folders/getAll',
  async ({ parentFolder, isStarred, isTrashed, tag } = {}, thunkAPI) => {
    try {
      let url = '/folders?';
      if (parentFolder) url += `parentFolder=${parentFolder}&`;
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

// Delete folder
export const deleteFolder = createAsyncThunk(
  'folders/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/folders/${id}`);
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

// Update folder (rename or recolor)
export const updateFolder = createAsyncThunk(
  'folders/update',
  async ({ id, name, color }, thunkAPI) => {
    try {
      const response = await api.patch(`/folders/${id}`, { name, color });
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

// Toggle star folder
export const toggleStarFolder = createAsyncThunk(
  'folders/toggleStar',
  async (id, thunkAPI) => {
    try {
      const response = await api.patch(`/folders/${id}/star`);
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

// Restore folder
export const restoreFolder = createAsyncThunk(
  'folders/restore',
  async (id, thunkAPI) => {
    try {
      const response = await api.patch(`/folders/${id}/restore`);
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

export const folderSlice = createSlice({
  name: 'folders',
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
      .addCase(createFolder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.folders.push(action.payload);
        state.folders.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getFolders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getFolders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.folders = action.payload;
      })
      .addCase(getFolders.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.folders = state.folders.filter((folder) => folder._id !== action.payload);
      })
      .addCase(updateFolder.fulfilled, (state, action) => {
        const index = state.folders.findIndex((folder) => folder._id === action.payload._id);
        if (index !== -1) {
          state.folders[index] = action.payload;
          state.folders.sort((a, b) => a.name.localeCompare(b.name));
        }
      })
      .addCase(toggleStarFolder.fulfilled, (state, action) => {
        const index = state.folders.findIndex((folder) => folder._id === action.payload._id);
        if (index !== -1) {
          state.folders[index] = action.payload;
        }
      })
      .addCase(restoreFolder.fulfilled, (state, action) => {
        state.folders = state.folders.filter((folder) => folder._id !== action.payload._id);
      });
  },
});

export const { reset } = folderSlice.actions;
export default folderSlice.reducer;
