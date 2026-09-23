-- ============================================================================
-- ORACLE DBA HACKATHON PROJECT: ONLINE SHOPPING DATABASE
-- Script 05: Oracle DBA Performance Tuning, Index Health, & Execution Plans
-- Target Schema: ECOMMERCE_DBA / SYSDBA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tablespace Storage Utilization Query
-- ----------------------------------------------------------------------------
SELECT 
    df.tablespace_name,
    ROUND(df.bytes / (1024 * 1024), 2) AS total_allocated_mb,
    ROUND((df.bytes - NVL(fs.bytes, 0)) / (1024 * 1024), 2) AS used_space_mb,
    ROUND(NVL(fs.bytes, 0) / (1024 * 1024), 2) AS free_space_mb,
    ROUND(((df.bytes - NVL(fs.bytes, 0)) / df.bytes) * 100, 2) AS pct_used
FROM (
    SELECT tablespace_name, SUM(bytes) AS bytes
    FROM dba_data_files
    GROUP BY tablespace_name
) df
LEFT JOIN (
    SELECT tablespace_name, SUM(bytes) AS bytes
    FROM dba_free_space
    GROUP BY tablespace_name
) fs ON df.tablespace_name = fs.tablespace_name
ORDER BY pct_used DESC;

-- ----------------------------------------------------------------------------
-- 2. Schema Object Space Usage (Segments)
-- ----------------------------------------------------------------------------
SELECT 
    segment_name,
    segment_type,
    tablespace_name,
    ROUND(bytes / 1024, 2) AS size_kb,
    extents,
    blocks
FROM user_segments
ORDER BY bytes DESC;

-- ----------------------------------------------------------------------------
-- 3. Index Health, Distinct Keys, and Clustering Factor
-- ----------------------------------------------------------------------------
SELECT 
    table_name,
    index_name,
    uniqueness,
    status,
    distinct_keys,
    clustering_factor,
    num_rows
FROM user_indexes
ORDER BY table_name, index_name;

-- ----------------------------------------------------------------------------
-- 4. EXPLAIN PLAN Analysis: Customer Order History View Query
-- ----------------------------------------------------------------------------
EXPLAIN PLAN FOR
SELECT * 
FROM vw_customer_order_history
WHERE customer_id = 1
ORDER BY order_date DESC;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(NULL, NULL, 'TYPICAL'));

-- ----------------------------------------------------------------------------
-- 5. Foreign Key Index Coverage Check (Finding Unindexed Foreign Keys)
-- ----------------------------------------------------------------------------
SELECT 
    c.table_name,
    c.constraint_name,
    cc.column_name,
    c.r_constraint_name
FROM user_constraints c
JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name
WHERE c.constraint_type = 'R'
  AND NOT EXISTS (
      SELECT 1 
      FROM user_ind_columns ic 
      WHERE ic.table_name = c.table_name 
        AND ic.column_name = cc.column_name
  );
