const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { initOraclePool, getDatabaseStatus } = require('./db');

const categoriesRouter = require('./routes/categories');
const productsRouter = require('./routes/products');
const customersRouter = require('./routes/customers');
const ordersRouter = require('./routes/orders');
const orderHistoryRouter = require('./routes/orderHistory');
const dbaRouter = require('./routes/dba');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/order-history', orderHistoryRouter);
app.use('/api/dba', dbaRouter);

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Serve static frontend bundle from client/dist
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start server
async function startServer() {
  console.log('[Server] Connecting to Oracle Database...');
  await initOraclePool();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Online Shopping System running on http://localhost:${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`📊 DBA Console API: http://localhost:${PORT}/api/dba/status`);
    console.log(`====================================================`);
  });
}

startServer();
