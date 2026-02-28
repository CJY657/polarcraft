/**
 * Auth Dialog Store
 * 认证对话框状态管理
 */

import { create } from 'zustand';

export type AuthMode = 'login' | 'register';

interface AuthDialogState {
  isOpen: boolean;
  mode: AuthMode;

  openDialog: (mode?: AuthMode) => void;
  closeDialog: () => void;
  switchMode: (mode: AuthMode) => void;
}

export const useAuthDialogStore = create<AuthDialogState>((set) => ({
  isOpen: false,
  mode: 'login',

  openDialog: (mode = 'login') =>
    set({ isOpen: true, mode }),

  closeDialog: () =>
    set({ isOpen: false }),

  switchMode: (mode) =>
    set({ mode })
}));
