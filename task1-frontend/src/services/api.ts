import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

export interface InteractionData {
  hcp_name: string;
  interaction_type: string;
  date?: string;
  topics_discussed?: string;
  sentiment: string;
  outcomes?: string;
  follow_up_actions?: string;
  attendees?: string[];
  materials?: string[];
  samples?: string[];
}

export interface InteractionResponse {
  id: number;
  hcp_name: string;
  interaction_type: string;
  date: string;
  topics_discussed: string | null;
  sentiment: string;
  outcomes: string | null;
  follow_up_actions: string | null;
  ai_suggested_followups: string | null;
  created_at: string;
  updated_at: string;
}

export interface HCPData {
  id: number;
  name: string;
  specialty: string | null;
  institution: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface MaterialData {
  id: number;
  name: string;
  type: string | null;
  description: string | null;
}

export interface SampleData {
  id: number;
  name: string;
  product: string | null;
  quantity: number;
}

export interface ChatResponseData {
  reply: string;
  form_data: Record<string, any> | null;
  saved_interaction: InteractionResponse | null;
  action_taken: string | null;
  suggested_followups: string[] | null;
}

// Interactions
export const createInteraction = (data: InteractionData) => API.post<InteractionResponse>('/interactions/', data);
export const getInteractions = () => API.get<InteractionResponse[]>('/interactions/');
export const getInteraction = (id: number) => API.get<InteractionResponse>(`/interactions/${id}`);
export const updateInteraction = (id: number, data: Partial<InteractionData>) => API.put<InteractionResponse>(`/interactions/${id}`, data);
export const deleteInteraction = (id: number) => API.delete(`/interactions/${id}`);

// HCPs
export const getHCPs = (search = '') => API.get<HCPData[]>(`/hcps/?search=${search}`);
export const seedHCPs = () => API.get('/hcps/seed');

// Materials & Samples
export const getMaterials = (search = '') => API.get<MaterialData[]>(`/materials?search=${search}`);
export const getSamples = () => API.get<SampleData[]>('/samples');
export const seedMaterials = () => API.get('/seed-materials');

// Chat (AI Agent) — single flow, no mode
export const sendChatMessage = (
  message: string,
  conversationHistory: { role: string; content: string }[] = [],
  interactionId: number | null = null,
  currentFormState: Record<string, any> | null = null,
) => API.post<ChatResponseData>('/chat/', {
  message,
  conversation_history: conversationHistory,
  interaction_id: interactionId,
  current_form_state: currentFormState,
});

export default API;
