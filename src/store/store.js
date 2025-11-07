import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';
import loginReducer from "./slices/loginSlice";
import marketReducer from "./slices/marketSlice";
import mfDataReducer from './slices/mfDataSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['login', 'marketWatch', 'mfData'], 
};

const rootReducer = combineReducers({
  login: loginReducer,
  marketWatch: marketReducer,
  mfData: mfDataReducer 
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;