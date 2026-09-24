const express = require('express');
const cors = require('cors');
const dbaRouter = require('../server/src/routes/dba');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/dba', dbaRouter);
app.use('/', dbaRouter);

module.exports = app;
