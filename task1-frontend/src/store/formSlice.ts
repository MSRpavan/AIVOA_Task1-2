import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { InteractionResponse } from '../services/api';

export interface FormState {
  hcp_name: string;
  interaction_type: string;
  date: string;
  time: string;
  attendees: string[];
  topics_discussed: string;
  sentiment: string;
  outcomes: string;
  follow_up_actions: string;
  selectedMaterials: string[];
  selectedSamples: string[];
  suggestedFollowups: string[];
  isDirty: boolean;
  savedId: number | null;
  editingId: number | null;  // non-null when editing an existing interaction
}

function freshDate() {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
}

function freshTime() {
  return new Date().toTimeString().slice(0, 5);
}

const initialState: FormState = {
  hcp_name: '',
  interaction_type: 'Meeting',
  date: freshDate(),
  time: freshTime(),
  attendees: [],
  topics_discussed: '',
  sentiment: 'Neutral',
  outcomes: '',
  follow_up_actions: '',
  selectedMaterials: [],
  selectedSamples: [],
  suggestedFollowups: [],
  isDirty: false,
  savedId: null,
  editingId: null,
};

const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    setField: (state, action: PayloadAction<{ field: keyof FormState; value: any }>) => {
      (state as any)[action.payload.field] = action.payload.value;
    },

    /** AI fills the form from chat extraction */
    fillFromAI: (state, action: PayloadAction<{
      form_data: Record<string, any>;
      suggested_followups?: string[];
    }>) => {
      const d = action.payload.form_data;
      if (d.hcp_name) state.hcp_name = d.hcp_name;
      if (d.interaction_type) state.interaction_type = d.interaction_type;
      if (d.topics_discussed) state.topics_discussed = d.topics_discussed;
      if (d.sentiment) state.sentiment = d.sentiment;
      if (d.outcomes) state.outcomes = d.outcomes;
      if (d.follow_up_actions) state.follow_up_actions = d.follow_up_actions;
      if (d.materials_shared) {
        state.selectedMaterials = Array.isArray(d.materials_shared)
          ? d.materials_shared
          : d.materials_shared.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (d.samples_distributed) {
        state.selectedSamples = Array.isArray(d.samples_distributed)
          ? d.samples_distributed
          : d.samples_distributed.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (action.payload.suggested_followups?.length) {
        state.suggestedFollowups = action.payload.suggested_followups;
      }
      state.isDirty = true;
      state.savedId = null;
    },

    /** Load an existing interaction from DB into the form for viewing/editing */
    loadInteraction: (state, action: PayloadAction<InteractionResponse>) => {
      const i = action.payload;
      state.hcp_name = i.hcp_name;
      state.interaction_type = i.interaction_type;
      // Parse date from ISO to DD-MM-YYYY (strip fractional seconds for Safari support)
      const safeDateStr = i.date.split('.')[0];
      const d = new Date(safeDateStr);
      if (!isNaN(d.getTime())) {
        state.date = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        state.time = d.toTimeString().slice(0, 5);
      }
      state.topics_discussed = i.topics_discussed || '';
      state.sentiment = i.sentiment;
      state.outcomes = i.outcomes || '';
      state.follow_up_actions = i.follow_up_actions || '';
      state.selectedMaterials = [];
      state.selectedSamples = [];
      state.suggestedFollowups = [];
      state.isDirty = false;
      state.savedId = i.id;
      state.editingId = i.id;
    },

    markSaved: (state, action: PayloadAction<number>) => {
      state.savedId = action.payload;
      state.editingId = action.payload;
    },

    /** Reset form to blank for a new interaction */
    resetForm: () => ({
      ...initialState,
      date: freshDate(),
      time: freshTime(),
    }),
  },
});

export const { setField, fillFromAI, loadInteraction, markSaved, resetForm } = formSlice.actions;
export default formSlice.reducer;
