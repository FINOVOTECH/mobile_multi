// mfDataSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mfData: [],
  loading: false,
  error: null,
};

const mfDataSlice = createSlice({
  name: 'mfData',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    addMfData: (state, action) => {
      state.mfData.push(action.payload);
      state.error = null;
    },
    setMfData: (state, action) => {
      state.mfData = action.payload;
      state.error = null;
    },
    clearMfData: (state) => {
      state.mfData = [];
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Remove specific item from mfData array
    removeMfData: (state, action) => {
      const index = action.payload;
      state.mfData.splice(index, 1);
    },
    // Update specific item in mfData array
    updateMfData: (state, action) => {
      const { index, data } = action.payload;
      if (state.mfData[index]) {
        state.mfData[index] = data;
      }
    },
  },
});

export const {
  setLoading,
  addMfData,
  setMfData,
  clearMfData,
  setError,
  clearError,
  removeMfData,
  updateMfData,
} = mfDataSlice.actions;

// Selectors
export const selectMfData = (state) => state.mfData.mfData;
export const selectMfDataLoading = (state) => state.mfData.loading;
export const selectMfDataError = (state) => state.mfData.error;

export default mfDataSlice.reducer;