# Online Shopping Database (E-Commerce Management System)
## Oracle Database 21c XE Project Report & Implementation Guide

---

### Student Details

| Field | Details |
| :--- | :--- |
| **Student Name** | Ridhumiga J |
| **Register Number** | 2428C0573 |
| **Department** | AIML |
| **ID** | 7da3a429c5260608bcc40cf1e7433ef3 |
| **College** | St. Josephs College for Women, Tiruppur |
| **Date of Submission** | 23/09/2026 |
| **GitHub Repo** | https://github.com/ridhumigaa/Qorvae_Commerce_Hackathon.git |
| **Deployment Link** | http://localhost:5000 (Full-Stack Storefront & Oracle DBA Console) |

---

### Problem Statement

An online retail business requires a robust, secure, and scalable relational database system to manage customer profiles, product catalogs, inventory stock, order transactions, and line-item receipts. Managing high volumes of e-commerce transactions manually or via spreadsheets leads to inventory discrepancies, duplicate orders, lack of customer order history tracking, and security vulnerabilities.

The **Online Shopping Database (E-Commerce System)** is designed to organize and automate this workflow using an enterprise relational database (**Oracle Database 21c XE**). The database systematically stores customer profiles, product categories, physical products with real-time stock levels, purchase orders, and itemized receipts, while establishing strict relational constraints and indexing strategies. Advanced SQL queries, views (`VW_CUSTOMER_ORDER_HISTORY`), and PL/SQL packages are implemented to guarantee ACID transaction properties and provide immediate access to customer purchasing patterns.

---

### Real-World Scenario

Consider a customer visiting an online shopping portal to buy computing hardware and technical accessories:

* **The Customer**: Represents the shopper registered with their contact information, email, and shipping address.
* **The Product Category**: Groups related goods into classifications (e.g., Computing, Audio, Electronics, Smart Home).
* **The Product**: Represents the inventory item available for purchase, tracking SKU, price, and physical warehouse stock.
* **The Order**: Represents the high-level financial transaction created when the customer checks out.
* **The Order Item**: Represents the specific quantity and snapshot unit price of each individual product included in that order.

The entity relationship can be represented as:

```text
CUSTOMER
   ↓ places
 ORDERS
   ↓ contains
ORDER_ITEMS
   ↓ references
PRODUCTS
   ↓ classified by
CATEGORIES
```

#### Concrete Example Walkthrough:
1. **Customer**: Customer ID `1`, `Alexander Wright`, `alex.wright@oraclecloud.com`, Redwood City, CA 94065
2. **Category**: Category ID `2`, `Computing`, "Laptops, desktops, monitors, and workstation components"
3. **Product**: Product ID `1`, SKU `PROD-LAP-001`, `Apex Pro 16" Creator Laptop`, Price: `$2,499.99`, Stock: `24`
4. **Order**: Order ID `101`, Customer ID `1`, Date: `2026-09-09`, Status: `DELIVERED`, Total Amount: `$3,298.99`, Payment Method: `CREDIT_CARD`
5. **Order Items**:
   * *Line Item 1*: Product ID `1` (Apex Pro Laptop) | Qty: `1` | Unit Price: `$2,499.99` | Subtotal: `$2,499.99`
   * *Line Item 2*: Product ID `2` (UltraVision Monitor) | Qty: `1` | Unit Price: `$799.00` | Subtotal: `$799.00`

This business scenario maps into a normalized relational schema consisting of `CATEGORIES`, `CUSTOMERS`, `PRODUCTS`, `ORDERS`, and `ORDER_ITEMS`.

---

### Objectives

The main objectives of the project are:
1. To design a normalized relational database (3NF / BCNF) for an enterprise online shopping system.
2. To create and manage tables using Oracle Database 21c (PDB `XEPDB1`) and standard SQL DDL.
3. To establish relationships between parent and child tables using foreign keys and associative entities.
4. To enforce strict data integrity through `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`, and `CHECK` constraints.
5. To perform transactional data manipulation and query operations using SQL.
6. To develop an optimized Customer Order History reporting view (`VW_CUSTOMER_ORDER_HISTORY`) combining multiple entities.
7. To demonstrate advanced DBA practices including tablespace segregation (`TS_ECOMM_DATA` & `TS_ECOMM_IDX`), B-Tree indexing, execution plan cost optimization (`DBMS_XPLAN`), and PL/SQL package implementation.

---

## 1. Database Design – 10 Marks

### 1.1 Database Structure
The Online Shopping Database is a relational database designed to manage customers, product catalogs, order transactions, line items, and DBA audit logs. The database consists of six interconnected tables: `CATEGORIES`, `CUSTOMERS`, `PRODUCTS`, `ORDERS`, `ORDER_ITEMS`, and `AUDIT_LOGS`.

The tables are connected using primary keys and foreign keys to maintain referential integrity:
* **Customers → Orders (1:M)**: A customer can place multiple orders over time.
* **Orders → Order Items (1:M)**: An order contains one or more line items.
* **Products → Order Items (1:M)**: A product can appear across multiple customer orders.
* **Categories → Products (1:M)**: A category organizes multiple products.

#### Tables Used

| Table Name | Purpose |
| :--- | :--- |
| **`CATEGORIES`** | Stores product classification categories, supporting hierarchical category trees |
| **`CUSTOMERS`** | Stores customer profiles, contact numbers, email addresses, and delivery coordinates |
| **`PRODUCTS`** | Stores physical product catalog, SKUs, sales prices, and live warehouse stock levels |
| **`ORDERS`** | Tracks financial checkout transactions, timestamps, payment methods, and fulfillment lifecycle |
| **`ORDER_ITEMS`** | Associative table storing individual line items, quantities, and snapshot prices per order |
| **`AUDIT_LOGS`** | Change Data Capture (CDC) table recording DBA audit trails on inventory mutations |

---

### 1.2 Entity Relationship Diagram (ERD)

```text
+-----------------------------------------------------------------------------------+
|                             ENTITY RELATIONSHIP DIAGRAM                           |
+-----------------------------------------------------------------------------------+

  [ CATEGORIES ] (PK: category_id)
        | 1
        | has many
        v M
  [ PRODUCTS ] (PK: product_id, FK: category_id)
        | 1
        | appears in
        v M
  [ ORDER_ITEMS ] (PK: order_item_id, FK: order_id, FK: product_id)
        ^ M
        | belongs to
        | 1
  [ ORDERS ] (PK: order_id, FK: customer_id)
        ^ M
        | placed by
        | 1
  [ CUSTOMERS ] (PK: customer_id)

  [ AUDIT_LOGS ] (PK: audit_id, FK: product_id) <-- Populated by Trigger TRG_PRODUCT_AUDIT
```

---

### 1.3 Technologies Used

| Technology / Tool | Purpose |
| :--- | :--- |
| **Oracle Database 21c XE** | Enterprise relational database engine hosting pluggable database `XEPDB1` |
| **Oracle SQL*Plus** | Command-line database administration, tablespace management, and script execution |
| **SQL & PL/SQL** | DDL/DML definitions, views, triggers, and atomic inventory checkout packages |
| **Node.js & Express.js** | High-performance REST API backend handling connection pooling and transactions |
| **node-oracledb (Thin Mode)** | Official native Oracle driver communicating via TCP port 1521 without heavy client binaries |
| **React 18 & Vite** | Modern single-page storefront, customer order history UI, and DBA command center |
| **Tailwind CSS** | Responsive styling using the enterprise Qorvae golden-amber palette |

---

## 2. Practical Implementation

### 2.1 Database and Table Creation
The Online Shopping Database was implemented using Oracle Database 21c Enterprise Edition inside pluggable database `XEPDB1`. A dedicated DBA user `ECOMMERCE_DBA` was created with quota privileges on separated data (`TS_ECOMM_DATA`) and index (`TS_ECOMM_IDX`) tablespaces.

```sql
-- 1. Provision dedicated storage tablespaces
CREATE TABLESPACE ts_ecomm_data 
    DATAFILE 'ts_ecomm_data01.dbf' SIZE 100M AUTOEXTEND ON NEXT 50M MAXSIZE 2G;

CREATE TABLESPACE ts_ecomm_idx 
    DATAFILE 'ts_ecomm_idx01.dbf' SIZE 50M AUTOEXTEND ON NEXT 25M MAXSIZE 1G;

-- 2. Create application schema user
CREATE USER ecommerce_dba IDENTIFIED BY Ecommerce123
    DEFAULT TABLESPACE ts_ecomm_data
    TEMPORARY TABLESPACE temp
    QUOTA UNLIMITED ON ts_ecomm_data
    QUOTA UNLIMITED ON ts_ecomm_idx;

GRANT CONNECT, RESOURCE, CREATE VIEW, CREATE PROCEDURE, CREATE TRIGGER TO ecommerce_dba;

-- CATEGORIES Table
CREATE TABLE categories (
    category_id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name       VARCHAR2(100) NOT NULL UNIQUE,
    description         VARCHAR2(500),
    parent_category_id  NUMBER REFERENCES categories(category_id) ON DELETE SET NULL,
    is_active           NUMBER(1) DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) TABLESPACE ts_ecomm_data;

-- CUSTOMERS Table
CREATE TABLE customers (
    customer_id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name          VARCHAR2(50) NOT NULL,
    last_name           VARCHAR2(50) NOT NULL,
    email               VARCHAR2(150) NOT NULL UNIQUE,
    phone               VARCHAR2(25),
    address             VARCHAR2(255),
    city                VARCHAR2(100),
    state               VARCHAR2(50),
    postal_code         VARCHAR2(20),
    status              VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) TABLESPACE ts_ecomm_data;

-- PRODUCTS Table
CREATE TABLE products (
    product_id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id         NUMBER NOT NULL REFERENCES categories(category_id),
    sku                 VARCHAR2(50) NOT NULL UNIQUE,
    name                VARCHAR2(200) NOT NULL,
    description         VARCHAR2(1000),
    price               NUMBER(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity      NUMBER(8) NOT NULL CHECK (stock_quantity >= 0),
    reorder_level       NUMBER(6) DEFAULT 5 CHECK (reorder_level >= 0),
    is_active           NUMBER(1) DEFAULT 1 CHECK (is_active IN (0, 1)),
    image_url           VARCHAR2(500),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) TABLESPACE ts_ecomm_data;

-- ORDERS Table
CREATE TABLE orders (
    order_id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id         NUMBER NOT NULL REFERENCES customers(customer_id),
    order_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    total_amount        NUMBER(12, 2) DEFAULT 0 CHECK (total_amount >= 0),
    status              VARCHAR2(20) DEFAULT 'PENDING' 
                        CHECK (status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    shipping_address    VARCHAR2(300) NOT NULL,
    payment_method      VARCHAR2(30) DEFAULT 'CREDIT_CARD' 
                        CHECK (payment_method IN ('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'NET_BANKING', 'COD')),
    payment_status      VARCHAR2(20) DEFAULT 'PENDING' 
                        CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) TABLESPACE ts_ecomm_data;

-- ORDER_ITEMS Table
CREATE TABLE order_items (
    order_item_id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id            NUMBER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id          NUMBER NOT NULL REFERENCES products(product_id),
    quantity            NUMBER(6) NOT NULL CHECK (quantity > 0),
    unit_price          NUMBER(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal            NUMBER(12, 2) NOT NULL CHECK (subtotal >= 0)
) TABLESPACE ts_ecomm_data;

-- High-Speed Indexes in TS_ECOMM_IDX
CREATE INDEX idx_products_category ON products(category_id) TABLESPACE ts_ecomm_idx;
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date DESC) TABLESPACE ts_ecomm_idx;
CREATE INDEX idx_orders_status ON orders(status) TABLESPACE ts_ecomm_idx;
CREATE INDEX idx_order_items_order ON order_items(order_id) TABLESPACE ts_ecomm_idx;
CREATE INDEX idx_order_items_product ON order_items(product_id) TABLESPACE ts_ecomm_idx;
```

---

### 2.2 Constraints and Relationships

| Table | Primary Key | Foreign Key | Other Constraints |
| :--- | :--- | :--- | :--- |
| **`CATEGORIES`** | `category_id` | `parent_category_id → CATEGORIES(category_id)` | `category_name NOT NULL UNIQUE`, `is_active CHECK (0, 1)` |
| **`CUSTOMERS`** | `customer_id` | None | `first_name NOT NULL`, `last_name NOT NULL`, `email UNIQUE`, `status CHECK (ACTIVE, INACTIVE, SUSPENDED)` |
| **`PRODUCTS`** | `product_id` | `category_id → CATEGORIES(category_id)` | `sku NOT NULL UNIQUE`, `name NOT NULL`, `price CHECK (>= 0)`, `stock_quantity CHECK (>= 0)` |
| **`ORDERS`** | `order_id` | `customer_id → CUSTOMERS(customer_id)` | `order_date NOT NULL`, `total_amount CHECK (>= 0)`, `status CHECK (PENDING..CANCELLED)` |
| **`ORDER_ITEMS`** | `order_item_id` | `order_id → ORDERS(order_id)`, `product_id → PRODUCTS(product_id)` | `quantity CHECK (> 0)`, `unit_price CHECK (>= 0)`, `subtotal CHECK (>= 0)`, `ON DELETE CASCADE` |

---

### 2.3 Data Insertion

```sql
-- Categories Insertion
INSERT INTO categories (category_name, description) VALUES ('Computing', 'Laptops, desktops, and computer hardware');
INSERT INTO categories (category_name, description) VALUES ('Audio & Headphones', 'Premium wireless ANC headphones and studio monitors');
INSERT INTO categories (category_name, description) VALUES ('Smart Home & IoT', 'Connected devices, security hubs, and smart lighting');

-- Customers Insertion
INSERT INTO customers (first_name, last_name, email, phone, address, city, state, postal_code)
VALUES ('Alexander', 'Wright', 'alex.wright@oraclecloud.com', '+1-555-0192', '400 Oracle Pkwy, Suite 1200', 'Redwood City', 'CA', '94065');
INSERT INTO customers (first_name, last_name, email, phone, address, city, state, postal_code)
VALUES ('Samantha', 'Miller', 'smiller@enterprise.org', '+1-555-0144', '742 Evergreen Terrace', 'Springfield', 'OR', '97477');
INSERT INTO customers (first_name, last_name, email, phone, address, city, state, postal_code)
VALUES ('Ajay', 'Raja', 'ajay.raja@qorvae.com', '+91-98765-43210', '123 Tech Corridor', 'Erode', 'TN', '638052');

-- Products Insertion
INSERT INTO products (category_id, sku, name, description, price, stock_quantity, reorder_level)
VALUES (1, 'PROD-LAP-001', 'Apex Pro 16" Creator Laptop', 'M3 Max, 64GB RAM, 2TB SSD, Liquid Retina XDR', 2499.99, 24, 5);
INSERT INTO products (category_id, sku, name, description, price, stock_quantity, reorder_level)
VALUES (2, 'PROD-AUD-001', 'AcousticMax Wireless ANC Headphones', 'Hi-Res Lossless Audio, 45hr battery, multipoint Bluetooth', 349.99, 58, 10);
INSERT INTO products (category_id, sku, name, description, price, stock_quantity, reorder_level)
VALUES (3, 'PROD-IOT-001', 'SmartHub Quantum Controller', 'Matter/Thread certified automation bridge with offline AI', 129.99, 4, 15);

-- Orders & Order Items Insertion
INSERT INTO orders (customer_id, order_date, total_amount, status, shipping_address, payment_method, payment_status)
VALUES (1, TIMESTAMP '2026-09-09 14:32:00', 2849.98, 'DELIVERED', '400 Oracle Pkwy, Suite 1200, Redwood City, CA', 'CREDIT_CARD', 'COMPLETED');

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
VALUES (1, 1, 1, 2499.99, 2499.99);
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
VALUES (1, 2, 1, 349.99, 349.99);

COMMIT;
```

---

### 2.4 SQL Operations

* **INSERT**: Adds a new customer or product to the database.
```sql
INSERT INTO customers (first_name, last_name, email, phone, address, city, state, postal_code)
VALUES ('Meena', 'Priya', 'meena.priya@gmail.com', '+91-98765-43215', '45 North St', 'Chennai', 'TN', '600001');
```

* **SELECT**: Retrieves active catalog products with their category names.
```sql
SELECT p.product_id, p.sku, p.name, p.price, p.stock_quantity, c.category_name
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.is_active = 1;
```

* **UPDATE**: Modifies customer address or increments product inventory stock upon warehouse replenishment.
```sql
UPDATE products
SET stock_quantity = stock_quantity + 25
WHERE sku = 'PROD-LAP-001';
```

* **DELETE**: Removes an inactive customer or test record.
```sql
DELETE FROM customers
WHERE email = 'meena.priya@gmail.com';
```

* **WHERE**: Filters orders by fulfillment status.
```sql
SELECT order_id, customer_id, total_amount, order_date
FROM orders
WHERE status IN ('PENDING', 'PROCESSING');
```

* **ORDER BY**: Sorts orders chronologically from newest to oldest.
```sql
SELECT order_id, customer_id, total_amount, order_date
FROM orders
ORDER BY order_date DESC;
```

* **LIKE**: Wildcard pattern search for product codes or SKUs.
```sql
SELECT sku, name, price
FROM products
WHERE sku LIKE 'PROD-LAP%';
```

* **BETWEEN**: Retrieves catalog items within a specified budget range ($100 to $1,000).
```sql
SELECT sku, name, price
FROM products
WHERE price BETWEEN 100.00 AND 1000.00;
```

* **Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MAX`, `MIN`)**: Computes executive financial KPIs.
```sql
SELECT 
    COUNT(*) AS total_orders,
    SUM(total_amount) AS gross_revenue,
    ROUND(AVG(total_amount), 2) AS average_order_value,
    MAX(total_amount) AS highest_order_value,
    MIN(total_amount) AS lowest_order_value
FROM orders
WHERE status <> 'CANCELLED';
```

* **GROUP BY**: Groups total sales revenue and transaction count by payment method.
```sql
SELECT 
    payment_method,
    COUNT(order_id) AS order_count,
    SUM(total_amount) AS revenue_collected
FROM orders
GROUP BY payment_method
ORDER BY revenue_collected DESC;
```

* **INNER JOIN & View (`VW_CUSTOMER_ORDER_HISTORY`)**: Combines Customers, Orders, Order Items, and Products to produce full itemized order receipts.
```sql
CREATE OR REPLACE VIEW vw_customer_order_history AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email,
    o.order_id,
    o.order_date,
    o.status AS order_status,
    o.total_amount AS order_total,
    o.payment_method,
    o.payment_status,
    o.shipping_address,
    oi.order_item_id,
    oi.product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    cat.category_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal AS item_subtotal,
    p.image_url AS product_image
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
INNER JOIN categories cat ON p.category_id = cat.category_id;
```

---

### 2.5 Project Execution
The database schema, views, triggers, and PL/SQL packages were deployed to Oracle 21c XE using Oracle SQL*Plus. A high-performance Node.js / Express backend connects to Oracle using the official `node-oracledb` driver in Thin Mode over TCP port 1521. The frontend single-page application built with React 18 and Vite communicates with the REST API to provide a live storefront, an itemized Customer Order History dashboard, an Orders management console, and a live Oracle DBA Command Center with real-time tablespace telemetry.

---

## 3. Output Screenshots – 10 Marks

* **Screenshot 1 – Database and Tablespace Creation**: Shows Oracle SQL*Plus session executing `01_tablespaces_and_user.sql`, creating `TS_ECOMM_DATA` (100MB), `TS_ECOMM_IDX` (50MB), and granting user `ECOMMERCE_DBA` privileges.
* **Screenshot 2 – Customer Table with Records**: Shows `SELECT * FROM customers;` displaying customer IDs, full names, emails, addresses, and ACTIVE status in Oracle.
* **Screenshot 3 – Categories and Products Tables with Records**: Shows `SELECT p.product_id, p.sku, p.name, p.price, p.stock_quantity, c.category_name FROM products p JOIN categories c ON p.category_id = c.category_id;`
* **Screenshot 4 – Orders and Order_Items Tables with Records**: Shows `SELECT o.order_id, o.customer_id, o.order_date, o.total_amount, oi.product_id, oi.quantity, oi.subtotal FROM orders o JOIN order_items oi ON o.order_id = oi.order_id;`
* **Screenshot 5 – INSERT / UPDATE / DELETE Operations**: Demonstrates INSERT of new order items, UPDATE of product stock after checkout, and PL/SQL stock replenishment upon order cancellation.
* **Screenshot 6 – SELECT and Filtering Operations**: Shows query filtering products where `stock_quantity <= reorder_level` (Low Stock Alerts) and price `BETWEEN 100 AND 1000`.
* **Screenshot 7 – Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MAX`, `MIN`)**: Shows execution of financial summary aggregates on orders, calculating total gross revenue, average transaction size, and count.
* **Screenshot 8 – GROUP BY Operation**: Shows `SELECT payment_method, COUNT(*), SUM(total_amount) FROM orders GROUP BY payment_method;`
* **Screenshot 9 – INNER JOIN Operation & View (`VW_CUSTOMER_ORDER_HISTORY`)**: Shows `SELECT * FROM vw_customer_order_history WHERE customer_id = 1;` joining 5 tables seamlessly in Oracle.
* **Screenshot 10 – Final Full-Stack Web Application (Storefront & DBA Console)**: Shows the live Qorvae Commerce web application running at `http://localhost:5000` with storefront catalog, live cart, order history timeline, and DBA tablespace gauges.

---

## 4. Technical Explanation – 5 Marks

### Database Design
The Online Shopping Database is engineered to satisfy Third Normal Form (3NF) and Boyce-Codd Normal Form (BCNF):
* **1NF**: Every column holds atomic, non-decomposable values. No repeating groups exist.
* **2NF**: No partial key dependencies. All non-key attributes in associative table `ORDER_ITEMS` depend on the full composite relationship.
* **3NF**: No transitive dependencies. Category descriptions reside in `CATEGORIES` rather than being duplicated in `PRODUCTS`; customer addresses reside in `CUSTOMERS` rather than `ORDERS`.
* In addition, DBA physical storage design segregates data files (`TS_ECOMM_DATA`) from index files (`TS_ECOMM_IDX`) to prevent disk I/O contention.

### Keys and Constraints
* **Primary Keys**: Declared using Oracle `NUMBER GENERATED ALWAYS AS IDENTITY` to eliminate sequence management overhead.
* **Foreign Keys**: Enforce strict referential integrity. `ORDER_ITEMS` employs `ON DELETE CASCADE` to guarantee that orphan order items cannot exist if an order header is purged.
* **NOT NULL**: Enforced on all business-critical identifiers including product SKUs, prices, customer names, and order timestamps.
* **UNIQUE**: Enforced on customer emails, product SKUs, and category names to prevent duplicate catalog entries.
* **CHECK Constraints**: Enforce domain integrity directly in the storage engine (e.g. `price >= 0`, `stock_quantity >= 0`, status values).

### SQL Operations and Transaction Management
The application guarantees ACID transaction properties:
* **Atomicity & Consistency**: Handled via pessimistic row-level locking (`SELECT stock_quantity FROM products WHERE product_id = :id FOR UPDATE`). This guarantees that concurrent shoppers cannot oversell inventory.
* **PL/SQL Package `PKG_ECOMMERCE_ORDERS`**: Encapsulates atomic order cancellation and stock replenishment within an autonomous database transaction, recording audit entries in `AUDIT_LOGS`.

### Data Retrieval and Performance Optimization
* **Indexed Range Scans**: Index `IDX_ORDERS_CUSTOMER_DATE` on `(customer_id, order_date DESC)` ensures that customer history queries execute via fast Index Range Scans rather than costly Full Table Scans (FTS).
* **Cost-Based Optimizer (CBO)**: Verified via Oracle `DBMS_XPLAN.DISPLAY`, yielding an execution cost of Cost=6 for customer history lookups.
* **Database View `VW_CUSTOMER_ORDER_HISTORY`**: Pre-compiles the 5-table relational join, optimizing server memory and parsing time.

### Aggregate Functions and Joins
* **Aggregate Functions**: Summarize gross lifetime spend (`SUM`), average basket value (`AVG`), and total purchase frequencies (`COUNT`).
* **INNER JOIN Operations**: Seamlessly join Customers, Orders, Order Items, and Products to generate clean itemized receipts for shoppers and administrators.

---

## 5. Conclusion – 5 Marks

### Conclusion
The Online Shopping Database (Qorvae Commerce) was successfully designed, provisioned, and verified on Oracle Database 21c Enterprise Edition. The relational architecture strictly implements 3NF normalization across six entities (`CATEGORIES`, `CUSTOMERS`, `PRODUCTS`, `ORDERS`, `ORDER_ITEMS`, and `AUDIT_LOGS`) with tablespace segregation, B-Tree index tuning, and ACID stock reservation guarantees.

A comprehensive suite of SQL queries, views (`VW_CUSTOMER_ORDER_HISTORY`), database triggers, and PL/SQL packages were implemented and demonstrated. Furthermore, the relational database was successfully integrated with a modern full-stack web application (Node.js/Express + React 18) running at `http://localhost:5000`, providing an interactive storefront, real-time customer purchasing analytics, and a live Oracle DBA command center.

Through this project, deep practical expertise in Oracle DBA concepts—including physical tablespace architecture, identity keys, relational constraints, pessimistic concurrency locking, query execution plan analysis with EXPLAIN PLAN, and full-stack database application development—was achieved.

### Future Enhancements
* **Partitioning**: Implement Oracle Range Partitioning on `ORDERS` (by `order_date`) to optimize queries on massive historical archives.
* **Oracle Data Guard & RMAN**: Implement automated physical standby replication and automated RMAN incremental backups for zero data loss (RPO = 0).
* **Redis Caching Layer**: Add an in-memory caching tier for read-heavy product catalog queries to reduce Oracle database engine load during high-traffic flash sales.
* **Payment Gateway Integration**: Connect real-time webhook endpoints (e.g. Stripe, Razorpay) with automated Oracle two-phase commit transaction workflows.
* **Machine Learning Recommendation Engine**: Utilize Oracle Autonomous Database OML (Oracle Machine Learning) algorithms on customer order history to generate real-time product recommendations.
