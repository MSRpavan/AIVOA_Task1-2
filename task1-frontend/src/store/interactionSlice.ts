import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as api from '../services/api';
import type { InteractionResponse, InteractionData } from '../services/api';

interface InteractionState {
  items: InteractionResponse[];
  currentInteraction: InteractionResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: InteractionState = {
  items: [],
  currentInteraction: null,
  loading: false,
  error: null,
};

export const fetchInteractions = createAsyncThunk(
  'interactions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.getInteractions();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch interactions');
    }
  }
);

export const addInteraction = createAsyncThunk(
  'interactions/add',
  async (data: InteractionData, { rejectWithValue }) => {
    try {
      const res = await api.createInteraction(data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to create interaction');
    }
  }
);

export const editInteraction = createAsyncThunk(
  'interactions/edit',
  async ({ id, data }: { id: number; data: Partial<InteractionData> }, { rejectWithValue }) => {
    try {
      const res = await api.updateInteraction(id, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update interaction');
    }
  }
);

export const removeInteraction = createAsyncThunk(
  'interactions/remove',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.deleteInteraction(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to delete interaction');
    }
  }
);

const interactionSlice = createSlice({
  name: 'interactions',
  initialState,
  reducers: {
    setCurrentInteraction: (state, action: PayloadAction<InteractionResponse>) => {
      state.currentInteraction = action.payload;
    },
    clearCurrentInteraction: (state) => {
      state.currentInteraction = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchInteractions.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchInteractions.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addInteraction.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addInteraction.fulfilled, (state, action) => { state.loading = false; state.items.unshift(action.payload); })
      .addCase(addInteraction.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(editInteraction.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(removeInteraction.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      });
  },
});

export const { setCurrentInteraction, clearCurrentInteraction, clearError } = interactionSlice.actions;
export default interactionSlice.reducer;
