const express = require('express');
const cors = require('cors');
const productsRouter = require('../server/src/routes/products');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/', productsRouter);

module.exports = app;
