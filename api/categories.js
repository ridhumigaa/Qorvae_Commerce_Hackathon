const express = require('express');
const cors = require('cors');
const categoriesRouter = require('../server/src/routes/categories');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/categories', categoriesRouter);
app.use('/', categoriesRouter);

module.exports = app;
