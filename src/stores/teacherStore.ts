import { create } from 'zustand';

interface Homeroom {
  id: number;
  display_name: string;
  grade: number;
  section: string;
}

interface TeacherState {
  // null  = confirmed no homeroom
  // undefined = not yet fetched
  homeroom: Homeroom | null | undefined;
  setHomeroom: (homeroom: Homeroom | null) => void;
  clearHomeroom: () => void;
}

export const useTeacherStore = create<TeacherState>((set) => ({
  homeroom: undefined,

  setHomeroom: (homeroom) => set({ homeroom }),

  clearHomeroom: () => set({ homeroom: undefined }),
}));
