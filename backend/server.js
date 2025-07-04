import express from 'express';
import cors from 'cors';
import config from './config.js';
import { testConnection, closePool } from './database.js';
import countryRoutes from './routes/countries.js';
import mapRoutes from './routes/map.js';
import clusteringRoutes from './routes/clustering.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: config.server.env
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// API routes
app.use('/api/countries', countryRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/clustering', clusteringRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: config.server.env === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Cannot start server without database connection');
      process.exit(1);
    }

    app.listen(config.server.port, () => {
      console.log('TradeLens Backend API Server Started');
      console.log(`Running on port: ${config.server.port}`);
      console.log(`Environment: ${config.server.env}`);
      console.log(`API Base URL: http://localhost:${config.server.port}`);
      console.log(`Frontend URL: ${config.server.frontendUrl}`);
      console.log('Available endpoints:');
      console.log('   • GET  /health');
      console.log('   • GET  /api/countries');
      console.log('   • GET  /api/map/geojson');
      console.log('   • GET  /api/clustering/mse');
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\nShutting down server (${signal})...`);
  await closePool();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer(); 