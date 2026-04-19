import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as api from '../services/api';
import { fillFromAI, loadInteraction } from './formSlice';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  action_taken?: string | null;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { message, conversationHistory, interactionId, currentFormState }:
    { message: string; conversationHistory: { role: string; content: string }[]; interactionId?: number | null; currentFormState?: Record<string, any> | null },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const res = await api.sendChatMessage(message, conversationHistory, interactionId, currentFormState);
      const data = res.data;

      // Always fill the form if we got form_data back
      if (data.form_data) {
        dispatch(fillFromAI({
          form_data: data.form_data,
          suggested_followups: data.suggested_followups || [],
        }));
      }

      // If the tool saved or edited on DB, load it natively
      if (data.saved_interaction?.id) {
        dispatch(loadInteraction(data.saved_interaction));
      }

      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'AI Agent is unavailable');
    }
  },
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage: (state, action: PayloadAction<string>) => {
      state.messages.push({ role: 'user', content: action.payload });
    },
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({
          role: 'assistant',
          content: action.payload.reply,
          action_taken: action.payload.action_taken,
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.messages.push({ role: 'assistant', content: `Error: ${action.payload}` });
      });
  },
});

export const { addUserMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
