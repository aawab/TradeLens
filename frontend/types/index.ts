// Global data types
export interface CountryData {
  Country: string;
  'Co2-Emissions': number;
  GDP: number;
  Population: number;
  'Life expectancy': number;
}

export interface GeojsonFeature {
  type: 'Feature';
  properties: {
    name: string;
    Country: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface GeojsonData {
  type: 'FeatureCollection';
  features: GeojsonFeature[];
}

// Chart related types
export type ChartFeature = 'Co2-Emissions' | 'GDP' | 'Population' | 'Life expectancy';
export type ChartVariable = ChartFeature;

export interface ScatterVariables {
  x?: ChartVariable;
  y?: ChartVariable;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Component Props
export interface MapProps {
  countries: string[];
  setCountries: (countries: string[]) => void;
  feature: ChartFeature;
}

export interface BarChartProps {
  // No props needed - component is self-contained with hardcoded MSE data
}

export interface ScatterPlotProps {
  selectedCountries: string[];
  xVariable: ChartFeature;
  yVariable: ChartFeature;
}

export interface PCPProps {
  selectedCountries: string[];
}

// API Response types (for future backend integration)
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ProcessedDataResponse {
  clusterData: CountryData[];
  mseValues: number[];
  optimalK: number;
}

// State management types
export interface AppState {
  feature: ChartFeature;
  k: number;
  orderVars: string[];
  scatterVariables: ScatterVariables;
  currentAxis: 'X' | 'Y';
  countries: string[];
  isLoading: boolean;
  error: string | null;
}

export interface DataState {
  countryData: CountryData[];
  geojsonData: GeojsonData | null;
  processedData: ProcessedDataResponse | null;
  lastUpdated: Date | null;
}

// Form and UI types
export interface RadioOption<T> {
  value: T;
  label: string;
}

export interface SelectOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

// D3 related types (will be properly typed when d3 is installed)
export interface D3Selection<T = any> {
  selection: any; // d3.Selection<T, any, any, any> when @types/d3 is available
}

export interface TooltipData {
  country: string;
  feature: string;
  value: number | string;
  x: number;
  y: number;
}

// Clustering and ML types
export interface ClusterResult {
  clusters: number[];
  centroids: number[][];
  mse: number;
  silhouetteScore?: number;
}

export interface PCAnalysisResult {
  transformedData: number[][];
  explainedVariance: number[];
  components: number[][];
} 