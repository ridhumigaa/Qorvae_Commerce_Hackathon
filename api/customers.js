const express = require('express');
const cors = require('cors');
const customersRouter = require('../server/src/routes/customers');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/customers', customersRouter);
app.use('/', customersRouter);

module.exports = app;
