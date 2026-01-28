/**
 * Auth Store - Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      loading: true,

      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        loading: false 
      }),

      setToken: (token) => {
        if (token) {
          localStorage.setItem('accessToken', token);
        } else {
          localStorage.removeItem('accessToken');
        }
        set({ token });
      },

      setLoading: (loading) => set({ loading }),

      login: (user, token, refreshToken) => {
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(user));
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          loading: false 
        });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          loading: false 
        });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      },

      // Initialize auth from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ 
              user, 
              token, 
              isAuthenticated: true,
              loading: false 
            });
            return true;
          } catch {
            // Invalid user data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        }
        
        set({ loading: false });
        return false;
      },

      // Helpers
      hasRole: (requiredRole) => {
        const user = get().user;
        if (!user?.role) return false;
        
        const roleHierarchy = {
          citizen: 1,
          uc_chairman: 2,
          township_officer: 3,
          mayor: 4,
          admin: 5,
        };
        
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
      },

      isRole: (role) => {
        const user = get().user;
        return user?.role === role;
      },

      getDashboardPath: () => {
        const user = get().user;
        if (!user?.role) return '/login';
        
        switch (user.role) {
          case 'admin':
            return '/admin/dashboard';
          case 'mayor':
            return '/mayor/dashboard';
          case 'township_officer':
            return '/township/dashboard';
          case 'uc_chairman':
            return '/uc/dashboard';
          case 'citizen':
          default:
            return '/citizen/dashboard';
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        // Only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
