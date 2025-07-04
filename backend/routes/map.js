import { Router } from 'express';
import { query } from '../database.js';
import { VALID_FEATURES, validateFeature } from '../constants.js';

const router = Router();

// Get GeoJSON data for world map
router.get('/geojson', async (req, res) => {
  try {
    const result = await query('SELECT type, features FROM geojson_data LIMIT 1');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'GeoJSON data not found' });
    }

    // The features are stored as an array in the database
    // Return complete GeoJSON structure
    res.json({
      type: result.rows[0].type || 'FeatureCollection',
      features: result.rows[0].features || []
    });
  } catch (error) {
    console.error('Error fetching GeoJSON data:', error);
    res.status(500).json({ error: 'Failed to fetch GeoJSON data' });
  }
});

// Get map data with specific feature
router.get('/feature/:feature', async (req, res) => {
  try {
    const { feature } = req.params;
    
    if (!validateFeature(feature)) {
      return res.status(400).json({ 
        error: `Invalid feature. Must be one of: ${VALID_FEATURES.join(', ')}` 
      });
    }

    const result = await query(`
      SELECT country, ${feature} as value
      FROM countries 
      WHERE ${feature} IS NOT NULL AND ${feature} > 0
      ORDER BY ${feature} DESC
    `);

    const values = result.rows.map(row => parseFloat(row.value));
    
    res.json({
      feature,
      countries: result.rows,
      stats: {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length
      }
    });
  } catch (error) {
    console.error('Error fetching feature data:', error);
    res.status(500).json({ error: 'Failed to fetch feature data' });
  }
});

// Get world data with all features
router.get('/worlddata', async (req, res) => {
  try {
    const result = await query(`
      SELECT country, co2_emissions, gdp, population, life_expectancy
      FROM countries 
      WHERE country IS NOT NULL
      ORDER BY country ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching world data:', error);
    res.status(500).json({ error: 'Failed to fetch world data' });
  }
});

// Get top countries by feature
router.get('/top/:feature/:limit', async (req, res) => {
  try {
    const { feature, limit } = req.params;
    const numLimit = parseInt(limit) || 10;
    
    if (!validateFeature(feature)) {
      return res.status(400).json({ 
        error: `Invalid feature. Must be one of: ${VALID_FEATURES.join(', ')}` 
      });
    }

    if (numLimit < 1 || numLimit > 50) {
      return res.status(400).json({ error: 'Limit must be between 1 and 50' });
    }

    const result = await query(`
      SELECT country, ${feature} as value
      FROM countries 
      WHERE ${feature} IS NOT NULL AND ${feature} > 0
      ORDER BY ${feature} DESC
      LIMIT $1
    `, [numLimit]);

    res.json(result.rows.map(row => ({
      country: row.country,
      value: parseFloat(row.value)
    })));
  } catch (error) {
    console.error('Error fetching top countries:', error);
    res.status(500).json({ error: 'Failed to fetch top countries' });
  }
});

export default router; 