import { query, testConnection, closePool } from '../database.js';

const createTables = async () => {
  try {
    console.log('Starting database migration...');

    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }

    // Create countries table
    await query(`
      CREATE TABLE IF NOT EXISTS countries (
        id SERIAL PRIMARY KEY,
        country VARCHAR(255) UNIQUE NOT NULL,
        co2_emissions DECIMAL,
        gdp BIGINT,
        population BIGINT,
        life_expectancy DECIMAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    await query(`CREATE INDEX IF NOT EXISTS idx_countries_country ON countries(country)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_countries_gdp ON countries(gdp)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_countries_population ON countries(population)`);

    // Create geojson table for map data
    await query(`
      CREATE TABLE IF NOT EXISTS geojson_data (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        features JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create clustering data table
    await query(`
      CREATE TABLE IF NOT EXISTS clustering_data (
        id SERIAL PRIMARY KEY,
        k_value INTEGER NOT NULL,
        mse_value DECIMAL NOT NULL,
        optimal_k INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database migration completed successfully!');
    console.log('Tables created:');
    console.log('   • countries');
    console.log('   • geojson_data');  
    console.log('   • clustering_data');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
};

// Run migration
createTables(); 