import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "./api";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  roles: Array<{ name: string }>;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          await api.login(email, password);
          const { data: userData } = await api.getCurrentUser();
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || "Login failed",
            isLoading: false,
          });
        }
      },

      loginWithGoogle: async () => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await api.loginWithGoogle();
          // Redirect to Google's auth page
          if (data?.redirect_url && typeof window !== "undefined") {
            window.location.href = data.redirect_url;
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || "Google login failed",
            isLoading: false,
          });
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await api.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || "Logout failed",
            isLoading: false,
          });
        }
      },

      fetchUser: async () => {
        try {
          set({ isLoading: true });
          const { data: userData } = await api.getCurrentUser();
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      // Only persist non-sensitive data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper hook to check if user has a specific role
export const useHasRole = (role: string) => {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;
  return user.roles.some((r) => r.name === role);
};

// Check if user is admin
export const useIsAdmin = () => useHasRole("admin");
