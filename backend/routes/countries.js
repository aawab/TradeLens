import { Router } from 'express';
import { query } from '../database.js';
import { VALID_FEATURES, validateFeature } from '../constants.js';

const router = Router();

// Get all countries
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT country, co2_emissions, gdp, population, life_expectancy
      FROM countries 
      WHERE country IS NOT NULL
      ORDER BY country ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// Get specific countries by names
router.post('/filter', async (req, res) => {
  try {
    const { countries } = req.body;
    
    if (!Array.isArray(countries)) {
      return res.status(400).json({ error: 'Countries array required' });
    }

    const placeholders = countries.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(`
      SELECT country, co2_emissions, gdp, population, life_expectancy
      FROM countries 
      WHERE country = ANY(ARRAY[${placeholders}])
      ORDER BY country ASC
    `, countries);

    res.json(result.rows);
  } catch (error) {
    console.error('Error filtering countries:', error);
    res.status(500).json({ error: 'Failed to filter countries' });
  }
});

// Get numeric values for a specific feature
router.get('/values/:feature', async (req, res) => {
  try {
    const { feature } = req.params;
    
    if (!validateFeature(feature)) {
      return res.status(400).json({ 
        error: `Invalid feature. Must be one of: ${VALID_FEATURES.join(', ')}` 
      });
    }

    const result = await query(`
      SELECT ${feature} as value
      FROM countries 
      WHERE ${feature} IS NOT NULL AND ${feature} > 0
      ORDER BY ${feature} ASC
    `);

    const values = result.rows.map(row => parseFloat(row.value));

    res.json({
      feature,
      values,
      stats: {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length
      }
    });
  } catch (error) {
    console.error('Error fetching feature values:', error);
    res.status(500).json({ error: 'Failed to fetch feature values' });
  }
});

// Get scatter plot data
router.get('/scatter/:xVar/:yVar', async (req, res) => {
  try {
    const { xVar, yVar } = req.params;
    
    if (!validateFeature(xVar) || !validateFeature(yVar)) {
      return res.status(400).json({ 
        error: `Invalid variables. Must be one of: ${VALID_FEATURES.join(', ')}` 
      });
    }

    const result = await query(`
      SELECT country, ${xVar} as x, ${yVar} as y
      FROM countries 
      WHERE ${xVar} IS NOT NULL AND ${yVar} IS NOT NULL AND ${xVar} > 0 AND ${yVar} > 0
      ORDER BY country ASC
    `);

    res.json(result.rows.map(row => ({
      country: row.country,
      x: parseFloat(row.x),
      y: parseFloat(row.y)
    })));
  } catch (error) {
    console.error('Error fetching scatter data:', error);
    res.status(500).json({ error: 'Failed to fetch scatter plot data' });
  }
});

// Get PCP data
router.get('/pcp', async (req, res) => {
  try {
    const result = await query(`
      SELECT country, co2_emissions, gdp, population, life_expectancy
      FROM countries 
      WHERE co2_emissions IS NOT NULL AND gdp IS NOT NULL 
        AND population IS NOT NULL AND life_expectancy IS NOT NULL
        AND co2_emissions > 0 AND gdp > 0 AND population > 0 AND life_expectancy > 0
      ORDER BY country ASC
    `);

    res.json(result.rows.map(row => ({
      country: row.country,
      'Co2-Emissions': parseFloat(row.co2_emissions),
      'GDP': parseInt(row.gdp),
      'Population': parseInt(row.population),
      'Life expectancy': parseFloat(row.life_expectancy)
    })));
  } catch (error) {
    console.error('Error fetching PCP data:', error);
    res.status(500).json({ error: 'Failed to fetch PCP data' });
  }
});

// Search countries by name
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    
    if (!term || term.length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters' });
    }

    const result = await query(`
      SELECT country, co2_emissions, gdp, population, life_expectancy
      FROM countries 
      WHERE country ILIKE $1
      ORDER BY country ASC
      LIMIT 20
    `, [`%${term}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error searching countries:', error);
    res.status(500).json({ error: 'Failed to search countries' });
  }
});

export default router; 