/**
 * Filter Store - Zustand store for complaint filter state
 */

import { create } from 'zustand';

const initialFilters = {
  category: [],
  severity: { min: 1, max: 10 },
  status: [],
  dateRange: { start: null, end: null },
  territory: { uc: null, town: null },
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};

const useFilterStore = create((set, get) => ({
  // State
  filters: { ...initialFilters },
  
  // Active filter count
  getActiveFilterCount: () => {
    const { filters } = get();
    let count = 0;
    
    if (filters.category.length > 0) count++;
    if (filters.severity.min > 1 || filters.severity.max < 10) count++;
    if (filters.status.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.territory.uc || filters.territory.town) count++;
    if (filters.search) count++;
    
    return count;
  },

  // Has active filters
  hasActiveFilters: () => get().getActiveFilterCount() > 0,

  // Actions
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value, page: 1 }
  })),

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters, page: 1 }
  })),

  // Category filters
  toggleCategory: (category) => set((state) => {
    const categories = state.filters.category;
    const newCategories = categories.includes(category)
      ? categories.filter(c => c !== category)
      : [...categories, category];
    return { 
      filters: { ...state.filters, category: newCategories, page: 1 } 
    };
  }),

  setCategories: (categories) => set((state) => ({
    filters: { ...state.filters, category: categories, page: 1 }
  })),

  // Status filters
  toggleStatus: (status) => set((state) => {
    const statuses = state.filters.status;
    const newStatuses = statuses.includes(status)
      ? statuses.filter(s => s !== status)
      : [...statuses, status];
    return { 
      filters: { ...state.filters, status: newStatuses, page: 1 } 
    };
  }),

  setStatuses: (statuses) => set((state) => ({
    filters: { ...state.filters, status: statuses, page: 1 }
  })),

  // Severity filter
  setSeverity: (min, max) => set((state) => ({
    filters: { 
      ...state.filters, 
      severity: { min, max },
      page: 1 
    }
  })),

  // Date range filter
  setDateRange: (start, end) => set((state) => ({
    filters: { 
      ...state.filters, 
      dateRange: { start, end },
      page: 1 
    }
  })),

  // Territory filter
  setTerritory: (uc, town) => set((state) => ({
    filters: { 
      ...state.filters, 
      territory: { uc, town },
      page: 1 
    }
  })),

  setUC: (uc) => set((state) => ({
    filters: { 
      ...state.filters, 
      territory: { ...state.filters.territory, uc },
      page: 1 
    }
  })),

  setTown: (town) => set((state) => ({
    filters: { 
      ...state.filters, 
      territory: { ...state.filters.territory, town },
      page: 1 
    }
  })),

  // Search filter
  setSearch: (search) => set((state) => ({
    filters: { ...state.filters, search, page: 1 }
  })),

  // Sorting
  setSort: (sortBy, sortOrder = 'desc') => set((state) => ({
    filters: { ...state.filters, sortBy, sortOrder }
  })),

  // Pagination
  setPage: (page) => set((state) => ({
    filters: { ...state.filters, page }
  })),

  setLimit: (limit) => set((state) => ({
    filters: { ...state.filters, limit, page: 1 }
  })),

  nextPage: () => set((state) => ({
    filters: { ...state.filters, page: state.filters.page + 1 }
  })),

  prevPage: () => set((state) => ({
    filters: { ...state.filters, page: Math.max(1, state.filters.page - 1) }
  })),

  // Reset filters
  resetFilters: () => set({ filters: { ...initialFilters } }),

  resetFilter: (key) => set((state) => ({
    filters: { ...state.filters, [key]: initialFilters[key], page: 1 }
  })),

  // Convert filters to API params
  toApiParams: () => {
    const { filters } = get();
    const params = {};

    if (filters.category.length > 0) {
      params.category = filters.category.join(',');
    }
    if (filters.severity.min > 1) {
      params.severity_min = filters.severity.min;
    }
    if (filters.severity.max < 10) {
      params.severity_max = filters.severity.max;
    }
    if (filters.status.length > 0) {
      params.status = filters.status.join(',');
    }
    if (filters.dateRange.start) {
      params.date_from = filters.dateRange.start;
    }
    if (filters.dateRange.end) {
      params.date_to = filters.dateRange.end;
    }
    if (filters.territory.uc) {
      params.uc_id = filters.territory.uc;
    }
    if (filters.territory.town) {
      params.town = filters.territory.town;
    }
    if (filters.search) {
      params.search = filters.search;
    }
    params.sort = filters.sortBy;
    params.order = filters.sortOrder;
    params.page = filters.page;
    params.limit = filters.limit;

    return params;
  },
}));

export default useFilterStore;
