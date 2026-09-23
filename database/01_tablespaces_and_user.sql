-- ============================================================================
-- ORACLE DBA HACKATHON PROJECT: ONLINE SHOPPING DATABASE
-- Script 01: Tablespaces & User Provisioning (Run as SYSDBA in PDB XEPDB1)
-- ============================================================================

ALTER SESSION SET CONTAINER = XEPDB1;

-- 1. Create Data Tablespace if not exists
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM dba_tablespaces WHERE tablespace_name = 'TS_ECOMM_DATA';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE TABLESPACE TS_ECOMM_DATA 
                           DATAFILE ''ecommerce_data01.dbf'' SIZE 50M AUTOEXTEND ON NEXT 10M MAXSIZE 500M 
                           EXTENT MANAGEMENT LOCAL AUTOALLOCATE 
                           SEGMENT SPACE MANAGEMENT AUTO';
        DBMS_OUTPUT.PUT_LINE('Tablespace TS_ECOMM_DATA created.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Tablespace TS_ECOMM_DATA already exists.');
    END IF;

    -- 2. Create Index Tablespace if not exists
    SELECT COUNT(*) INTO v_count FROM dba_tablespaces WHERE tablespace_name = 'TS_ECOMM_IDX';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE TABLESPACE TS_ECOMM_IDX 
                           DATAFILE ''ecommerce_idx01.dbf'' SIZE 30M AUTOEXTEND ON NEXT 5M MAXSIZE 300M 
                           EXTENT MANAGEMENT LOCAL AUTOALLOCATE 
                           SEGMENT SPACE MANAGEMENT AUTO';
        DBMS_OUTPUT.PUT_LINE('Tablespace TS_ECOMM_IDX created.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Tablespace TS_ECOMM_IDX already exists.');
    END IF;

    -- 3. Create Application User / Schema
    SELECT COUNT(*) INTO v_count FROM all_users WHERE username = 'ECOMMERCE_DBA';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE USER ECOMMERCE_DBA IDENTIFIED BY Ecommerce123 
                           DEFAULT TABLESPACE TS_ECOMM_DATA 
                           TEMPORARY TABLESPACE TEMP 
                           QUOTA UNLIMITED ON TS_ECOMM_DATA 
                           QUOTA UNLIMITED ON TS_ECOMM_IDX';
        DBMS_OUTPUT.PUT_LINE('User ECOMMERCE_DBA created.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('User ECOMMERCE_DBA already exists.');
    END IF;
END;
/

-- 4. Grant Essential Privileges according to Least Privilege Architecture
GRANT CONNECT, RESOURCE TO ECOMMERCE_DBA;
GRANT CREATE VIEW TO ECOMMERCE_DBA;
GRANT CREATE PROCEDURE TO ECOMMERCE_DBA;
GRANT CREATE TRIGGER TO ECOMMERCE_DBA;
GRANT CREATE SEQUENCE TO ECOMMERCE_DBA;
GRANT CREATE SYNONYM TO ECOMMERCE_DBA;
GRANT EXECUTE ON DBMS_LOCK TO ECOMMERCE_DBA;

-- DBA performance analysis grants
GRANT SELECT_CATALOG_ROLE TO ECOMMERCE_DBA;

COMMIT;
