import React, { useEffect, useState } from 'react';
import {
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  MenuItem,
  InputLabel,
  Select,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

import { useAppStore } from './stores/appStore';
import { dataService } from './services/dataService';

import BarChart from './components/BarChart';
import PCP from './components/PCP';
import Map from './components/Map';
import ScatterPlot from './components/ScatterPlot';

import './App.css';
import type { ChartFeature } from './types/index';

const App: React.FC = () => {
  const {
    selectedCountries,
    setSelectedCountries,
    mapFeature,
    setMapFeature,
    isLoading,
    setIsLoading,
    error,
    setError
  } = useAppStore();

  const [xVar, setXVar] = useState<ChartFeature>('GDP');
  const [yVar, setYVar] = useState<ChartFeature>('Population');

  const chartFeatures: ChartFeature[] = ['GDP', 'Population', 'Life expectancy', 'Co2-Emissions'];

  // Initialize data service
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await dataService.loadAllData();
        console.log('Data service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize data service:', error);
        setError('Failed to load application data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [setIsLoading, setError]);

  const handleMapFeatureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMapFeature(event.target.value as ChartFeature);
  };

  const handleXChange = (event: SelectChangeEvent<ChartFeature>) => {
    setXVar(event.target.value as ChartFeature);
  };

  const handleYChange = (event: SelectChangeEvent<ChartFeature>) => {
    setYVar(event.target.value as ChartFeature);
  };

  if (error) {
    return (
      <div className="App">
        <div className="main-container">
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="app-title-container">
          <Typography className="app-title" component="h1">
            <span className="app-header-icon">🔍</span>
            TradeLens
            <span className="app-header-icon">📈</span>
          </Typography>
          <Typography className="app-subtitle" component="p">
            Global Trade & Development Analytics Platform
          </Typography>
        </div>
      </header>

      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-container">
          <CircularProgress size={60} />
        </div>
      )}

      <main className="main-container">
        {/* Top Row - Map and Scatter Plot */}
        <div className="visualization-grid top-row">
          {/* World Map */}
          <div className="map-section">
            <Paper elevation={3} className="viz-paper">
              <Typography className="viz-title" align="center">
                World Heatmap of {mapFeature}
              </Typography>
              
              <div className="viz-container">
                <div className="map-container">
                  <Map 
                    countries={selectedCountries} 
                    setCountries={setSelectedCountries} 
                    feature={mapFeature}
                  />
                </div>

                <div className="control-section">
                  <FormControl>
                    <RadioGroup
                      value={mapFeature}
                      onChange={handleMapFeatureChange}
                      row
                      className="radio-group"
                    >
                      {chartFeatures.map((f) => (
                        <FormControlLabel 
                          key={f}
                          value={f}
                          control={<Radio size="small" />}
                          label={f}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </div>
              </div>
            </Paper>
          </div>

          {/* Scatter Plot */}
          <div className="scatter-section">
            <Paper elevation={3} className="viz-paper">
              <Typography className="viz-title" align="center">
                Scatter Plot Analysis
              </Typography>

              <div className="viz-container">
                <div className="scatter-container">
                  <ScatterPlot
                    selectedCountries={selectedCountries}
                    xVariable={xVar}
                    yVariable={yVar}
                  />
                </div>

                <div className="control-section scatter-controls" style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <FormControl className="form-control-small" size="small">
                    <InputLabel>X-Axis Variable</InputLabel>
                    <Select
                      value={xVar}
                      label="X-Axis Variable"
                      onChange={handleXChange}
                    >
                      {chartFeatures.map((variable) => (
                        <MenuItem key={variable} value={variable}>
                          {variable}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl className="form-control-small" size="small">
                    <InputLabel>Y-Axis Variable</InputLabel>
                    <Select
                      value={yVar}
                      label="Y-Axis Variable"
                      onChange={handleYChange}
                    >
                      {chartFeatures.map((variable) => (
                        <MenuItem key={variable} value={variable}>
                          {variable}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Paper>
          </div>
        </div>

        {/* Bottom Row - Parallel Coordinates and K-Means */}
        <div className="visualization-grid bottom-row">
          {/* Parallel Coordinates Plot */}
          <div className="pcp-section">
            <Paper elevation={3} className="viz-paper">
              <Typography className="viz-title" align="center">
                Parallel Coordinates Plot
              </Typography>
              <div className="viz-container">
                <div className="pcp-container">
                  <PCP selectedCountries={selectedCountries} />
                </div>
              </div>
            </Paper>
          </div>

          {/* K-Means Clustering */}
          <div className="bar-section">
            <Paper elevation={3} className="viz-paper">
              <Typography className="viz-title" align="center">
                K-Means MSE Analysis
              </Typography>
              <div className="viz-container">
                <div className="bar-container">
                  <BarChart />
                </div>
              </div>
            </Paper>
          </div>
        </div>

        {/* Selected Countries Display */}
        <Paper elevation={2} className="info-section">
          <Typography className="info-title" gutterBottom>
            Selected Countries ({selectedCountries.length})
          </Typography>
          <Typography className="info-text" color="text.secondary">
            {selectedCountries.length > 0 ? selectedCountries.join(', ') : 'No countries selected'}
          </Typography>
        </Paper>

        {/* Current State Info */}
        <Paper elevation={1} className="info-section" sx={{ backgroundColor: '#f8f9fa' }}>
          <Typography className="info-title" gutterBottom>
            Current State:
          </Typography>
          <Typography className="info-text" component="div">
            • Feature: <strong>{mapFeature}</strong><br/>
            • Scatter variables: <strong>X={xVar}, Y={yVar}</strong><br/>
          </Typography>
        </Paper>
      </main>
    </div>
  );
};

export default App; 