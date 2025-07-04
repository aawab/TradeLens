import { Router } from 'express';
import { query } from '../database.js';

const router = Router();

// Get MSE data for K-means clustering
router.get('/mse', async (req, res) => {
  try {
    const result = await query(
      'SELECT k_value, mse_value FROM clustering_data ORDER BY k_value'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching MSE data:', error);
    res.status(500).json({ error: 'Failed to fetch MSE data' });
  }
});

// Get optimal K value
router.get('/optimal-k', async (req, res) => {
  try {
    const result = await query(
      'SELECT optimal_k FROM clustering_data WHERE optimal_k IS NOT NULL LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Optimal K not found' });
    }
    
    res.json({ optimalK: result.rows[0].optimal_k });
  } catch (error) {
    console.error('Error fetching optimal K:', error);
    res.status(500).json({ error: 'Failed to fetch optimal K' });
  }
});

// Get processed clustering data for specific K
router.get('/processed/:k', async (req, res) => {
  try {
    const k = parseInt(req.params.k);
    
    if (isNaN(k) || k < 1 || k > 10) {
      return res.status(400).json({ error: 'Invalid K value. Must be between 1 and 10.' });
    }

    // Get countries data and perform clustering simulation
    const result = await query(`
      SELECT country, gdp, population, life_expectancy, co2_emissions
      FROM countries 
      WHERE gdp IS NOT NULL AND population IS NOT NULL AND life_expectancy IS NOT NULL
      ORDER BY country
    `);

    // Simple clustering simulation (in production, you'd use actual clustering algorithm)
    const clusteredData = result.rows.map((country, index) => ({
      ...country,
      cluster: index % k // Simple assignment for demo
    }));

    res.json(clusteredData);
  } catch (error) {
    console.error('Error processing clustering data:', error);
    res.status(500).json({ error: 'Failed to process clustering data' });
  }
});

// Update optimal K value
router.put('/optimal-k', async (req, res) => {
  try {
    const { optimalK } = req.body;
    
    if (!optimalK || isNaN(optimalK) || optimalK < 1 || optimalK > 10) {
      return res.status(400).json({ error: 'Invalid optimal K value' });
    }

    // Update all records or insert if none exist
    const updateResult = await query(
      'UPDATE clustering_data SET optimal_k = $1 WHERE optimal_k IS NOT NULL',
      [optimalK]
    );

    if (updateResult.rowCount === 0) {
      await query(
        'INSERT INTO clustering_data (k_value, mse_value, optimal_k) VALUES (0, 0, $1)',
        [optimalK]
      );
    }

    res.json({ optimalK });
  } catch (error) {
    console.error('Error updating optimal K:', error);
    res.status(500).json({ error: 'Failed to update optimal K' });
  }
});

// Get clustering statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_records,
        MIN(k_value) as min_k,
        MAX(k_value) as max_k,
        AVG(mse_value) as avg_mse
      FROM clustering_data 
      WHERE k_value > 0
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching clustering stats:', error);
    res.status(500).json({ error: 'Failed to fetch clustering statistics' });
  }
});

export default router; 