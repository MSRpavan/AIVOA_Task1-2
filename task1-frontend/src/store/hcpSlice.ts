import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../services/api';
import type { HCPData, MaterialData, SampleData } from '../services/api';

interface HCPState {
  hcps: HCPData[];
  materials: MaterialData[];
  samples: SampleData[];
  loading: boolean;
}

const initialState: HCPState = {
  hcps: [],
  materials: [],
  samples: [],
  loading: false,
};

export const fetchHCPs = createAsyncThunk(
  'hcps/fetchAll',
  async (search: string = '', { rejectWithValue }) => {
    try {
      const res = await api.getHCPs(search);
      return res.data;
    } catch (err: any) {
      return rejectWithValue('Failed to fetch HCPs');
    }
  }
);

export const fetchMaterials = createAsyncThunk(
  'hcps/fetchMaterials',
  async (search: string = '', { rejectWithValue }) => {
    try {
      const res = await api.getMaterials(search);
      return res.data;
    } catch (err: any) {
      return rejectWithValue('Failed to fetch materials');
    }
  }
);

export const fetchSamples = createAsyncThunk(
  'hcps/fetchSamples',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.getSamples();
      return res.data;
    } catch (err: any) {
      return rejectWithValue('Failed to fetch samples');
    }
  }
);

const hcpSlice = createSlice({
  name: 'hcps',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHCPs.fulfilled, (state, action) => { state.hcps = action.payload; })
      .addCase(fetchMaterials.fulfilled, (state, action) => { state.materials = action.payload; })
      .addCase(fetchSamples.fulfilled, (state, action) => { state.samples = action.payload; });
  },
});

export default hcpSlice.reducer;
