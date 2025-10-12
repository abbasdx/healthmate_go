import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  postWithoutAuth,
  getWithAuth,
  putWithAuth,
} from "../services/httpService";
import { User } from "@/lib/types";



interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User, token: string) => void;
  clearError: () => void;
  logout: () => void;

  // API Actions
  loginDoctor: (email: string, password: string) => Promise<void>;
  loginPatient: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  registerDoctor: (data: any) => Promise<void>;
  registerPatient: (data: any) => Promise<void>;
  fetchProfile: () => Promise<User | null>;
   updateProfile: (data: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      setUser: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        });
        localStorage.setItem("token", token);
      },

      clearError: () => set({ error: null }),

      logout: () => {
        localStorage.removeItem("token");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      loginDoctor: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await postWithoutAuth("/auth/doctor/login", {
            email,
            password,
          });
          get().setUser(response.data.user, response.data.token);
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      loginPatient: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await postWithoutAuth("/auth/patient/login", {
            email,
            password,
          });
          get().setUser(response.data.user, response.data.token);
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      loginAdmin: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await postWithoutAuth("/admin/auth/login", {
            email,
            password,
          });
          get().setUser(response.data.user, response.data.token);
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      registerDoctor: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await postWithoutAuth("/auth/doctor/register", data);
          get().setUser(response.data.user, response.data.token);
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      registerPatient: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await postWithoutAuth(
            "/auth/patient/register",
            data
          );
          get().setUser(response.data.user, response.data.token);
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },


      fetchProfile: async (): Promise<User | null> => {
        set({ loading: true, error: null });
        try {
          const { user } = get();
          if (!user) throw new Error("No user found");
      
          let endpoint;
          if (user.type === "doctor") {
            endpoint = "/doctor/me";
          } else if (user.type === "patient") {
            endpoint = "/patient/me";
          } else if (user.type === "admin") {
            endpoint = "/admin/profile";
          } else {
            throw new Error("Invalid user type");
          }
          
          const response = await getWithAuth(endpoint);
      
          set({ user: { ...user, ...response.data } });
          return response.data;
        } catch (error: any) {
          set({ error: error.message });
          return null; // Return null after setting error, not before
        } finally {
          set({ loading: false });
        }
      },

      updateProfile: async (data) => {
        set({ loading: true, error: null });
        try {
          const { user } = get();
          if (!user) throw new Error("No user found");

          const endpoint =
            user.type === "doctor"
              ? "/doctor/onboarding/update"
              : "/patient/onboarding/update";
          const response = await putWithAuth(endpoint, data);

          set({ user: { ...user, ...response.data } });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
