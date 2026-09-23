const express = require('express');
const router = express.Router();
const { executeQuery, getDatabaseStatus } = require('../db');

// GET /api/dba/status - Oracle database server status & metadata
router.get('/status', async (req, res) => {
  const dbStatus = getDatabaseStatus();

  if (dbStatus.connected) {
    try {
      const bannerRes = await executeQuery(`SELECT banner_full FROM v$version WHERE ROWNUM = 1`);
      const dbInfoRes = await executeQuery(`SELECT name, open_mode, database_role, log_mode FROM v$database`);
      const countsRes = await executeQuery(`
        SELECT 
          (SELECT COUNT(*) FROM categories) AS categories_count,
          (SELECT COUNT(*) FROM customers) AS customers_count,
          (SELECT COUNT(*) FROM products) AS products_count,
          (SELECT COUNT(*) FROM orders) AS orders_count,
          (SELECT COUNT(*) FROM order_items) AS order_items_count,
          (SELECT COUNT(*) FROM audit_logs) AS audit_logs_count
        FROM dual
      `);

      return res.json({
        success: true,
        status: 'CONNECTED',
        engine: 'Oracle Database 21c Express Edition',
        pdb: 'XEPDB1',
        banner: bannerRes.rows[0]?.BANNER_FULL || 'Oracle Database 21c XE',
        database: dbInfoRes.rows[0],
        counts: countsRes.rows[0],
        config: {
          user: dbStatus.user,
          connectString: dbStatus.connectString
        }
      });
    } catch (err) {
      return res.json({
        success: true,
        status: 'CONNECTED_RESTRICTED',
        error: err.message,
        config: dbStatus
      });
    }
  } else {
    return res.json({
      success: true,
      status: 'FALLBACK_EMBEDDED',
      note: 'Oracle connection failed or offline; active in fallback simulation mode.',
      error: dbStatus.error,
      config: dbStatus
    });
  }
});

// GET /api/dba/tablespaces - tablespace storage consumption
router.get('/tablespaces', async (req, res) => {
  const dbStatus = getDatabaseStatus();

  if (dbStatus.connected) {
    try {
      const sql = `
        SELECT 
          df.tablespace_name,
          ROUND(df.bytes / (1024 * 1024), 2) AS total_mb,
          ROUND((df.bytes - NVL(fs.bytes, 0)) / (1024 * 1024), 2) AS used_mb,
          ROUND(NVL(fs.bytes, 0) / (1024 * 1024), 2) AS free_mb,
          ROUND(((df.bytes - NVL(fs.bytes, 0)) / df.bytes) * 100, 1) AS pct_used
        FROM (
          SELECT tablespace_name, SUM(bytes) AS bytes
          FROM user_tablespaces ut
          JOIN dba_data_files df USING (tablespace_name)
          GROUP BY tablespace_name
        ) df
        LEFT JOIN (
          SELECT tablespace_name, SUM(bytes) AS bytes
          FROM dba_free_space
          GROUP BY tablespace_name
        ) fs ON df.tablespace_name = fs.tablespace_name
        ORDER BY df.tablespace_name
      `;
      const result = await executeQuery(sql);
      return res.json({ success: true, data: result.rows });
    } catch (err) {
      // If user lacks DBA views grant, fallback to user_segments summary
      try {
        const segSql = `
          SELECT tablespace_name, ROUND(SUM(bytes)/(1024*1024), 2) AS used_mb, COUNT(*) AS segment_count
          FROM user_segments
          GROUP BY tablespace_name
        `;
        const segRes = await executeQuery(segSql);
        return res.json({ success: true, data: segRes.rows, note: 'Summary from USER_SEGMENTS' });
      } catch (innerErr) {
        return res.status(500).json({ success: false, error: innerErr.message });
      }
    }
  } else {
    return res.json({
      success: true,
      data: [
        { TABLESPACE_NAME: 'TS_ECOMM_DATA', TOTAL_MB: 50.0, USED_MB: 2.4, FREE_MB: 47.6, PCT_USED: 4.8 },
        { TABLESPACE_NAME: 'TS_ECOMM_IDX', TOTAL_MB: 30.0, USED_MB: 1.1, FREE_MB: 28.9, PCT_USED: 3.7 },
        { TABLESPACE_NAME: 'USERS', TOTAL_MB: 100.0, USED_MB: 12.8, FREE_MB: 87.2, PCT_USED: 12.8 }
      ],
      note: 'Simulated Tablespace Metrics'
    });
  }
});

// GET /api/dba/indexes - list user indexes and status
router.get('/indexes', async (req, res) => {
  const dbStatus = getDatabaseStatus();

  if (dbStatus.connected) {
    try {
      const sql = `
        SELECT 
          table_name,
          index_name,
          uniqueness,
          status,
          distinct_keys,
          clustering_factor,
          num_rows
        FROM user_indexes
        ORDER BY table_name, index_name
      `;
      const result = await executeQuery(sql);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    return res.json({
      success: true,
      data: [
        { TABLE_NAME: 'PRODUCTS', INDEX_NAME: 'IDX_PRODUCTS_CATEGORY', UNIQUENESS: 'NONUNIQUE', STATUS: 'VALID' },
        { TABLE_NAME: 'ORDERS', INDEX_NAME: 'IDX_ORDERS_CUSTOMER_DATE', UNIQUENESS: 'NONUNIQUE', STATUS: 'VALID' },
        { TABLE_NAME: 'ORDERS', INDEX_NAME: 'IDX_ORDERS_STATUS', UNIQUENESS: 'NONUNIQUE', STATUS: 'VALID' },
        { TABLE_NAME: 'ORDER_ITEMS', INDEX_NAME: 'IDX_ORDER_ITEMS_ORDER', UNIQUENESS: 'NONUNIQUE', STATUS: 'VALID' },
        { TABLE_NAME: 'ORDER_ITEMS', INDEX_NAME: 'IDX_ORDER_ITEMS_PRODUCT', UNIQUENESS: 'NONUNIQUE', STATUS: 'VALID' },
        { TABLE_NAME: 'CUSTOMERS', INDEX_NAME: 'UK_CUST_EMAIL', UNIQUENESS: 'UNIQUE', STATUS: 'VALID' }
      ]
    });
  }
});

// GET /api/dba/audit-logs - view audit records
router.get('/audit-logs', async (req, res) => {
  const dbStatus = getDatabaseStatus();

  if (dbStatus.connected) {
    try {
      const sql = `
        SELECT log_id, table_name, record_id, action, old_values, new_values, performed_by, logged_at
        FROM audit_logs
        ORDER BY log_id DESC
        FETCH FIRST 50 ROWS ONLY
      `;
      const result = await executeQuery(sql);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    return res.json({ success: true, count: 0, data: [] });
  }
});

// POST /api/dba/explain - runs EXPLAIN PLAN for a user query
router.post('/explain', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'A SQL query is required.' });
  }

  const trimmed = query.trim();
  if (!trimmed.toLowerCase().startsWith('select')) {
    return res.status(400).json({ success: false, error: 'Only SELECT queries can be evaluated in EXPLAIN PLAN.' });
  }

  const dbStatus = getDatabaseStatus();

  if (dbStatus.connected) {
    try {
      // 1. Run EXPLAIN PLAN FOR
      const statementId = `EXP_${Date.now()}`;
      await executeQuery(`EXPLAIN PLAN SET STATEMENT_ID = '${statementId}' FOR ${trimmed}`);

      // 2. Fetch formatted execution plan using DBMS_XPLAN
      const planRes = await executeQuery(`
        SELECT plan_table_output 
        FROM TABLE(DBMS_XPLAN.DISPLAY('PLAN_TABLE', '${statementId}', 'TYPICAL'))
      `);

      const lines = planRes.rows.map(r => r.PLAN_TABLE_OUTPUT);

      return res.json({
        success: true,
        statement_id: statementId,
        plan_output: lines,
        raw_text: lines.join('\n')
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    // Simulated Explain Plan output for demo
    const simulated = [
      `Plan hash value: 2984518291`,
      `------------------------------------------------------------------------------------------------------`,
      `| Id  | Operation                     | Name                    | Rows  | Bytes | Cost (%CPU)| Time     |`,
      `------------------------------------------------------------------------------------------------------`,
      `|   0 | SELECT STATEMENT              |                         |     6 |  1128 |     5   (0)| 00:00:01 |`,
      `|   1 |  NESTED LOOPS                 |                         |     6 |  1128 |     5   (0)| 00:00:01 |`,
      `|   2 |   NESTED LOOPS                |                         |     6 |  1128 |     5   (0)| 00:00:01 |`,
      `|   3 |    TABLE ACCESS BY INDEX ROWID| ORDERS                  |     3 |   246 |     2   (0)| 00:00:01 |`,
      `|*  4 |     INDEX RANGE SCAN          | IDX_ORDERS_CUSTOMER_DATE|     3 |       |     1   (0)| 00:00:01 |`,
      `|*  5 |    INDEX RANGE SCAN           | IDX_ORDER_ITEMS_ORDER   |     2 |       |     0   (0)| 00:00:01 |`,
      `|   6 |   TABLE ACCESS BY INDEX ROWID | PRODUCTS                |     1 |    84 |     1   (0)| 00:00:01 |`,
      `|*  7 |    INDEX UNIQUE SCAN          | SYS_C008492             |     1 |       |     0   (0)| 00:00:01 |`,
      `------------------------------------------------------------------------------------------------------`,
      `Predicate Information (identified by operation id):`,
      `---------------------------------------------------`,
      `   4 - access("O"."CUSTOMER_ID"=1)`,
      `   5 - access("O"."ORDER_ID"="OI"."ORDER_ID")`,
      `   7 - access("OI"."PRODUCT_ID"="P"."PRODUCT_ID")`
    ];

    return res.json({
      success: true,
      statement_id: 'SIMULATED_PLAN',
      plan_output: simulated,
      raw_text: simulated.join('\n'),
      note: 'Simulated Execution Plan'
    });
  }
});

// POST /api/dba/query - interactive safe SELECT runner
router.post('/query', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }

  const trimmed = query.trim();
  if (!trimmed.toLowerCase().startsWith('select')) {
    return res.status(400).json({ success: false, error: 'Only SELECT statements are allowed in the query runner.' });
  }

  const dbStatus = getDatabaseStatus();
  if (dbStatus.connected) {
    try {
      const result = await executeQuery(trimmed);
      return res.json({
        success: true,
        count: result.rows.length,
        columns: result.metaData ? result.metaData.map(m => m.name) : (result.rows.length > 0 ? Object.keys(result.rows[0]) : []),
        rows: result.rows
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    return res.status(503).json({ success: false, error: 'Oracle database not connected.' });
  }
});

module.exports = router;
