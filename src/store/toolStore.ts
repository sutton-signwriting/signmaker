import { create } from 'zustand';

export type Tool = 'language' | 'fingerspelling' | 'mouthing' | 'translate';

/** Which bottom-left tooling popover is open (driven by both clicks and keyboard shortcuts). */
interface ToolState {
  open: Tool | null;
  setOpen: (open: Tool | null) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  open: null,
  setOpen: (open) => set({ open }),
}));
