/**
 * Auth Dialog Store
 * 认证对话框状态管理
 */

import { create } from 'zustand';

export type AuthMode = 'login' | 'register';
export interface AuthDialogOpenOptions {
  returnTo?: string | null;
}

export interface AuthDialogCloseOptions {
  clearReturnTo?: boolean;
}

interface AuthDialogState {
  isOpen: boolean;
  mode: AuthMode;
  returnTo: string | null;

  openDialog: (mode?: AuthMode, options?: AuthDialogOpenOptions) => void;
  closeDialog: (options?: AuthDialogCloseOptions) => void;
  switchMode: (mode: AuthMode) => void;
  consumeReturnTo: () => string | null;
  clearReturnTo: () => void;
}

export const useAuthDialogStore = create<AuthDialogState>((set, get) => ({
  isOpen: false,
  mode: 'login',
  returnTo: null,

  openDialog: (mode = 'login', options) =>
    set({
      isOpen: true,
      mode,
      returnTo: options?.returnTo ?? null,
    }),

  closeDialog: (options) =>
    set((state) => ({
      isOpen: false,
      returnTo: options?.clearReturnTo === false ? state.returnTo : null,
    })),

  switchMode: (mode) =>
    set({ mode }),

  consumeReturnTo: () => {
    const returnTo = get().returnTo;
    set({ returnTo: null });
    return returnTo;
  },

  clearReturnTo: () =>
    set({ returnTo: null }),
}));
