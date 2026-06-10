import type { StateCreator } from 'zustand';
import type { AppState } from '../useAppStore';

export type AppSlice<T> = StateCreator<
  AppState,
  [],
  [],
  T
>;
