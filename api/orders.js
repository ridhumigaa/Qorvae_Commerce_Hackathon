const express = require('express');
const cors = require('cors');
const ordersRouter = require('../server/src/routes/orders');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/orders', ordersRouter);
app.use('/', ordersRouter);

module.exports = app;
