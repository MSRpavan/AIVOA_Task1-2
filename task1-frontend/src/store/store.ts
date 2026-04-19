import { configureStore } from '@reduxjs/toolkit';
import interactionReducer from './interactionSlice';
import chatReducer from './chatSlice';
import hcpReducer from './hcpSlice';
import formReducer from './formSlice';

const store = configureStore({
  reducer: {
    interactions: interactionReducer,
    chat: chatReducer,
    hcps: hcpReducer,
    form: formReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
