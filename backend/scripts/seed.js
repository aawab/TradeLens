import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { query, testConnection, closePool } from '../database.js';

// Parse numeric value helper
const parseNumericValue = (value) => {
  if (typeof value === 'number') return value;
  if (!value || value === '') return null;
  
  const cleanValue = value.toString()
    .replace(/,/g, '')
    .replace('$', '')
    .replace('%', '');
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? null : parsed;
};

// Seed countries data from CSV
const seedCountries = async () => {
  const csvPath = path.join('..', 'public', 'data', 'world-data-2023.csv');
  
  return new Promise((resolve, reject) => {
    const countries = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        countries.push({
          country: row.Country || row.country || row.NAME,
          co2_emissions: parseNumericValue(row['Co2-Emissions']),
          gdp: parseNumericValue(row.GDP),
          population: parseNumericValue(row.Population),
          life_expectancy: parseNumericValue(row['Life expectancy'])
        });
      })
      .on('end', () => {
        console.log(`📁 Parsed ${countries.length} countries from CSV`);
        resolve(countries);
      })
      .on('error', reject);
  });
};

// Seed geojson data
const seedGeojson = async () => {
  const geojsonPath = path.join('..', 'public', 'data', 'worldWithData.geojson');
  
  try {
    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
    return geojsonData;
  } catch (error) {
    console.error('❌ Error reading geojson file:', error.message);
    throw error;
  }
};

// Seed clustering data (MSE values)
const seedClusteringData = async () => {
  const mseData = [
    4192.208285950465, 2957.257034033883, 2482.2866645417175, 
    2092.231873076597, 1978.7127033802503, 1773.1183702411172, 
    1683.8174884991984, 1587.8448375236683, 1411.0062960787684, 
    1272.6786662918385
  ];
  
  const optimalK = 4;
  
  for (let i = 0; i < mseData.length; i++) {
    await query(
      'INSERT INTO clustering_data (k_value, mse_value, optimal_k) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [i + 1, mseData[i], optimalK]
    );
  }
  
  console.log(`📊 Seeded ${mseData.length} clustering data points`);
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }

    // Clear existing data
    await query('DELETE FROM countries');
    await query('DELETE FROM geojson_data');
    await query('DELETE FROM clustering_data');
    console.log('🗑️  Cleared existing data');

    // Seed countries
    const countries = await seedCountries();
    for (const country of countries) {
      if (country.country) {
        await query(
          `INSERT INTO countries (country, co2_emissions, gdp, population, life_expectancy) 
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (country) DO NOTHING`,
          [country.country, country.co2_emissions, country.gdp, country.population, country.life_expectancy]
        );
      }
    }
    console.log(`✅ Seeded ${countries.length} countries`);

    // Seed geojson
    const geojsonData = await seedGeojson();
    await query(
      'INSERT INTO geojson_data (type, features) VALUES ($1, $2)',
      [geojsonData.type, JSON.stringify(geojsonData.features)]
    );
    console.log('✅ Seeded geojson data');

    // Seed clustering data
    await seedClusteringData();

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
};

// Run seeding
seedDatabase(); 