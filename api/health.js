const { getDatabaseStatus } = require('../server/src/db');

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus()
  });
};
