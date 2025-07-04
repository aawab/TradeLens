import * as d3 from 'd3';
import type { CountryData, GeojsonData, ProcessedDataResponse } from '../types/index';

// Base API URL configuration
const API_BASE_URL = 'http://localhost:5000';

// Field mapping between API and component names
const FIELD_MAP: Record<string, string> = {
  'Co2-Emissions': 'co2_emissions',
  'GDP': 'gdp',
  'Population': 'population',
  'Life expectancy': 'life_expectancy'
};

// Data loading utilities
export class DataService {
  private static instance: DataService;
  private worldData: Map<string, any> = new Map();
  private csvData: any[] = [];
  private geoData: any = null;
  private loading = false;
  private loadPromise: Promise<void> | null = null;

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async loadAllData(): Promise<void> {
    if (this.isLoaded()) return;

    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = this._loadData();
    
    try {
      await this.loadPromise;
    } finally {
      this.loading = false;
    }
  }

  private async _loadData(): Promise<void> {
    try {
      console.log('Loading data from API...');
      
      const [geoResponse, countriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/map/geojson`),
        fetch(`${API_BASE_URL}/api/countries`)
      ]);

      if (!geoResponse.ok || !countriesResponse.ok) {
        throw new Error('Failed to fetch data from API');
      }

      const geoJsonResponse = await geoResponse.json();
      this.csvData = await countriesResponse.json();
      
      // Handle both array response (features directly) and object response (proper GeoJSON)
      if (Array.isArray(geoJsonResponse)) {
        // Backend returned features array directly
        this.geoData = {
          type: 'FeatureCollection',
          features: geoJsonResponse
        };
      } else {
        // Backend returned proper GeoJSON object
        this.geoData = geoJsonResponse;
      }
      
      // Transform API data to component format
      this.worldData.clear();
      this.csvData.forEach(d => {
        const countryName = d.country || d.Country || d.NAME;
        if (countryName) {
          this.worldData.set(countryName, {
            Country: countryName,
            'Co2-Emissions': d.co2_emissions || 0,
            GDP: d.gdp || 0,
            Population: d.population || 0,
            'Life expectancy': d.life_expectancy || 0
          });
        }
      });

      console.log(`Data loaded successfully: ${this.csvData.length} countries, ${this.geoData?.features?.length || 0} geographic features`);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      return this._loadFallbackData();
    }
  }

  private async _loadFallbackData(): Promise<void> {
    try {
      console.log('API unavailable, falling back to local files...');
      
      const [geoData, csvData] = await Promise.all([
        d3.json('/public/data/worldWithData.geojson'),
        d3.csv('/public/data/world-data-2023.csv')
      ]);

      this.geoData = geoData;
      this.csvData = csvData || [];
      
      // Process world data
      this.worldData.clear();
      this.csvData.forEach(d => {
        const countryName = d.Country || d.country || d.NAME;
        if (countryName) {
          this.worldData.set(countryName, d);
        }
      });

      console.log(`Fallback data loaded: ${this.csvData.length} countries, ${(this.geoData as any)?.features?.length || 0} geographic features`);
      
    } catch (error) {
      console.error('Failed to load fallback data:', error);
      throw error;
    }
  }

  // Getters
  getWorldData() { return this.worldData; }
  getCsvData() { return this.csvData; }
  getGeoData() { return this.geoData; }
  isLoaded() { return !!(this.worldData.size > 0 && this.csvData.length > 0 && this.geoData); }
  isLoading() { return this.loading; }

  getCountryData(countryName: string) {
    return this.worldData.get(countryName) || null;
  }

  getNumericValues(feature: string): number[] {
    if (!this.csvData.length) return [];
    
    const apiField = FIELD_MAP[feature] || feature;
    
    return this.csvData
      .map(d => parseNumericValue(d[apiField] || d[feature]))
      .filter(v => !isNaN(v) && v > 0);
  }

  getValidDataForScatter(xVar: string, yVar: string): any[] {
    if (!this.csvData.length) return [];

    const xField = FIELD_MAP[xVar] || xVar;
    const yField = FIELD_MAP[yVar] || yVar;

    return this.csvData
      .map(d => ({
        country: d.country || d.Country || d.NAME || 'Unknown',
        x: parseNumericValue(d[xField] || d[xVar]),
        y: parseNumericValue(d[yField] || d[yVar]),
        originalData: d
      }))
      .filter(d => !isNaN(d.x) && !isNaN(d.y) && d.x > 0 && d.y > 0);
  }

  getValidDataForPCP(columns: string[]): any[] {
    if (!this.csvData.length) return [];

    return this.csvData
      .map(d => {
        const countryName = d.country || d.Country || d.NAME || 'Unknown';
        const dataPoint: any = { 
          country: countryName,
          originalData: d
        };
        
        columns.forEach(col => {
          const apiField = FIELD_MAP[col] || col;
          dataPoint[col] = parseNumericValue(d[apiField] || d[col]);
        });
        
        return dataPoint;
      })
      .filter(d => columns.every(col => !isNaN(d[col]) && d[col] > 0));
  }

  async processDataForClustering(data: CountryData[], k: number): Promise<ProcessedDataResponse> {
    try {
      console.log(`Processing data for k-means clustering with k=${k}`);
      
      const [mseResponse, optimalKResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/clustering/mse`),
        fetch(`${API_BASE_URL}/api/clustering/optimal-k`)
      ]);

      let mseValues: number[] = [];
      let optimalK = 4;

      if (mseResponse.ok && optimalKResponse.ok) {
        const mseData = await mseResponse.json();
        const optimalData = await optimalKResponse.json();
        
        mseValues = mseData.map((item: any) => parseFloat(item.mse_value) || 0);
        optimalK = parseInt(optimalData.optimalK) || 4;
      } else {
        // Fallback MSE values
        mseValues = [4192.21, 2957.26, 2482.29, 2092.23, 1978.71, 1773.12, 1683.82, 1587.84, 1411.01, 1272.68];
      }

      return { clusterData: data, mseValues, optimalK };
    } catch (error) {
      console.error('Error processing data for clustering:', error);
      // Return fallback data
      return {
        clusterData: data,
        mseValues: [4192.21, 2957.26, 2482.29, 2092.23, 1978.71, 1773.12, 1683.82, 1587.84, 1411.01, 1272.68],
        optimalK: 4
      };
    }
  }

  clearCache(): void {
    this.worldData.clear();
    this.csvData = [];
    this.geoData = null;
    this.loadPromise = null;
  }

  getCacheStatus() {
    return {
      worldData: this.worldData.size > 0,
      csvData: this.csvData.length > 0,
      geoData: !!this.geoData,
    };
  }
}

// Export singleton instance
export const dataService = DataService.getInstance();

// Utility functions for data transformation
export const parseNumericValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  const cleanValue = value.toString()
    .replace(/,/g, '')
    .replace('$', '')
    .replace('%', '');
  
  return parseFloat(cleanValue) || 0;
};

export const formatNumber = (value: number, type: 'currency' | 'percentage' | 'number' = 'number'): string => {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    case 'percentage':
      return `${value.toFixed(2)}%`;
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
};

// Data validation utilities
export const validateCountryData = (data: any[]): CountryData[] => {
  return data.filter(item => 
    item && 
    typeof item === 'object' && 
    (item.Country || item.country) && 
    typeof (item.Country || item.country) === 'string'
  ).map(item => ({
    Country: item.Country || item.country,
    'Co2-Emissions': parseNumericValue(item['Co2-Emissions'] || item.co2_emissions || 0),
    GDP: parseNumericValue(item.GDP || item.gdp || 0),
    Population: parseNumericValue(item.Population || item.population || 0),
    'Life expectancy': parseNumericValue(item['Life expectancy'] || item.life_expectancy || 0),
  }));
}; 