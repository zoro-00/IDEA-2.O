// ============================================================
// STAR — UI Store
// Global UI state (panels, modals, sidebar)
// ============================================================
import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  activePanel: string | null;
  commandPaletteOpen: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setActivePanel: (panelId: string | null) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  activePanel: null,
  commandPaletteOpen: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  setActivePanel: (panelId) => set({ activePanel: panelId }),
  setCommandPaletteOpen: (isOpen) => set({ commandPaletteOpen: isOpen }),
}));
