const express = require('express');
const cors = require('cors');
const orderHistoryRouter = require('../server/src/routes/orderHistory');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/order-history', orderHistoryRouter);
app.use('/', orderHistoryRouter);

module.exports = app;
