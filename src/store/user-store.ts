// src/store/user-store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface UserSettings {
  notifications_enabled?: boolean;
  reminders_enabled?: boolean;
  reminder_time?: number;
  preferred_tutors?: Record<string, number>;
}

// Тип, который приходит с API /profile/me
interface UserBase {
  telegram_id: number;
  first_name?: string | null;
  username?: string | null;
  is_admin: boolean;
  is_blocked: boolean;
  group_id?: number | null;
  subgroup_number?: number | null;
  settings: UserSettings; // <-- Добавляем объект настроек
}

// Тип, который мы используем в приложении
export interface User extends UserBase {
  group_name?: string | null;
}

interface UserState {
  token: string | null;
  user: User | null;
  isAuth: boolean;
  isLoading: boolean;
  setToken: (token: string) => void;
  fetchUser: () => Promise<void>;
  updateLocalUser: (data: Partial<User>) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuth: false,
      isLoading: true,
      setToken: (token: string) => { set({ token, isAuth: !!token }); },
      fetchUser: async () => {
        if (!get().token) { set({ isLoading: false }); return; }
        try {
          const { data: baseUser } = await api.get<UserBase>('/api/v1/profile/me');
          
          let group_name: string | null = null;
          if (baseUser.group_id) {
            try {
              const { data: groupData } = await api.get(`/api/v1/dicts/groups/${baseUser.group_id}`);
              group_name = groupData.name;
            } catch (groupError) {
              console.error(`Failed to fetch group name for id ${baseUser.group_id}`, groupError);
            }
          }
          
          set({ user: { ...baseUser, group_name }, isLoading: false });

        } catch (error) {
          console.error('Failed to fetch user', error);
          set({ isLoading: false, isAuth: false, token: null, user: null });
        }
      },
      updateLocalUser: (data) => {
        set((state) => ({
            user: state.user ? { ...state.user, ...data } : null
        }))
      },
      logout: () => { set({ token: null, user: null, isAuth: false }); },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);