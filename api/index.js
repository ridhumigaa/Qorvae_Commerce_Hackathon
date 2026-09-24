const express = require('express');
const cors = require('cors');
const { initOraclePool, getDatabaseStatus } = require('../server/src/db');

const categoriesRouter = require('../server/src/routes/categories');
const productsRouter = require('../server/src/routes/products');
const customersRouter = require('../server/src/routes/customers');
const ordersRouter = require('../server/src/routes/orders');
const orderHistoryRouter = require('../server/src/routes/orderHistory');
const dbaRouter = require('../server/src/routes/dba');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize DB or fallback immediately
initOraclePool().catch(err => console.error('[Vercel Serverless] DB init error:', err));

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

module.exports = app;
