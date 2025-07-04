import type { 
  AppState, 
  ChartFeature, 
  ScatterVariables, 
  CountryData 
} from '../types/index';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface AppStore {
  // Data and loading states
  isLoading: boolean;
  error: string | null;
  
  // Country selection
  selectedCountries: string[];
  setSelectedCountries: (countries: string[]) => void;
  
  // Map configuration
  mapFeature: ChartFeature;
  setMapFeature: (feature: ChartFeature) => void;
  
  // Scatter plot configuration
  xVar: ChartFeature;
  yVar: ChartFeature;
  setXVar: (variable: ChartFeature) => void;
  setYVar: (variable: ChartFeature) => void;
  
  // K-means configuration
  k: number;
  setK: (k: number) => void;
  
  // UI state
  currentAxis: 'X' | 'Y';
  setCurrentAxis: (axis: 'X' | 'Y') => void;
  
  // Actions
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      // Initial state
      isLoading: false,
      error: null,
      
      // Country selection
      selectedCountries: ['United States', 'China', 'India', 'Germany', 'Japan', 'United Kingdom', 'France'],
      setSelectedCountries: (countries) => set({ selectedCountries: countries }),
      
      // Map configuration
      mapFeature: 'Population' as ChartFeature,
      setMapFeature: (feature) => set({ mapFeature: feature }),
      
      // Scatter plot configuration
      xVar: 'Co2-Emissions' as ChartFeature,
      yVar: 'Population' as ChartFeature,
      setXVar: (variable) => set({ xVar: variable }),
      setYVar: (variable) => set({ yVar: variable }),
      
      // K-means configuration
      k: 4,
      setK: (k) => set({ k }),
      
      // UI state
      currentAxis: 'X',
      setCurrentAxis: (axis) => set({ currentAxis: axis }),
      
      // Actions
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearData: () => set({
        selectedCountries: [],
        mapFeature: 'Co2-Emissions' as ChartFeature,
        xVar: 'Co2-Emissions' as ChartFeature,
        yVar: 'Population' as ChartFeature,
        k: 4,
        currentAxis: 'X',
        error: null
      })
    }),
    {
      name: 'tradelens-store',
    }
  )
);
 