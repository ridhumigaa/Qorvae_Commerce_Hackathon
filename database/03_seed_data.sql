-- ============================================================================
-- ORACLE DBA HACKATHON PROJECT: ONLINE SHOPPING DATABASE
-- Script 03: Seed Data Insertion (Realistic Enterprise Demo Data)
-- Target Schema: ECOMMERCE_DBA
-- ============================================================================

SET DEFINE OFF;

-- Clean existing data
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM customers;
DELETE FROM categories;
DELETE FROM audit_logs;

-- ----------------------------------------------------------------------------
-- 1. Insert Categories
-- ----------------------------------------------------------------------------
INSERT INTO categories (category_id, category_name, description, parent_category_id, is_active)
VALUES (1, 'Electronics', 'Consumer electronics, gadgets, and cutting-edge devices', NULL, 1);

INSERT INTO categories (category_id, category_name, description, parent_category_id, is_active)
VALUES (2, 'Computing', 'Laptops, desktops, monitors, and workstation components', 1, 1);

INSERT INTO categories (category_id, category_name, description, parent_category_id, is_active)
VALUES (3, 'Audio and Wearables', 'Headphones, smartwatches, and wireless audio equipment', 1, 1);

INSERT INTO categories (category_id, category_name, description, parent_category_id, is_active)
VALUES (4, 'Home and Office', 'Ergonomic furniture, smart home automation, and accessories', NULL, 1);

INSERT INTO categories (category_id, category_name, description, parent_category_id, is_active)
VALUES (5, 'Books and Media', 'Technical literature, database administration guides, and novels', NULL, 1);

INSERT INTO categories (category_id, category_name, description, parent_category_id, is_active)
VALUES (6, 'Apparel and Gear', 'Developer hoodies, smart backpacks, and technical clothing', NULL, 1);

-- ----------------------------------------------------------------------------
-- 2. Insert Customers
-- ----------------------------------------------------------------------------
INSERT INTO customers (customer_id, first_name, last_name, email, phone, address, city, state, postal_code, country, status)
VALUES (1, 'Alexander', 'Wright', 'alex.wright@oraclecloud.com', '+1-415-555-0101', '400 Oracle Parkway, Suite 1200', 'Redwood City', 'CA', '94065', 'USA', 'ACTIVE');

INSERT INTO customers (customer_id, first_name, last_name, email, phone, address, city, state, postal_code, country, status)
VALUES (2, 'Samantha', 'Miller', 'sam.miller@techcorp.io', '+1-206-555-0142', '742 Evergreen Terrace', 'Seattle', 'WA', '98101', 'USA', 'ACTIVE');

INSERT INTO customers (customer_id, first_name, last_name, email, phone, address, city, state, postal_code, country, status)
VALUES (3, 'Devon', 'Chen', 'devon.chen@dataforge.net', '+1-512-555-0189', '1100 Silicon Hills Blvd', 'Austin', 'TX', '78701', 'USA', 'ACTIVE');

INSERT INTO customers (customer_id, first_name, last_name, email, phone, address, city, state, postal_code, country, status)
VALUES (4, 'Priya', 'Sharma', 'priya.sharma@cyberinfra.in', '+91-98200-12345', 'Plot 42, Hitec City Phase 2', 'Hyderabad', 'TS', '500081', 'India', 'ACTIVE');

INSERT INTO customers (customer_id, first_name, last_name, email, phone, address, city, state, postal_code, country, status)
VALUES (5, 'Marcus', 'Vance', 'marcus.vance@quantumlink.org', '+1-617-555-0199', '88 Innovation Way', 'Boston', 'MA', '02110', 'USA', 'ACTIVE');

INSERT INTO customers (customer_id, first_name, last_name, email, phone, address, city, state, postal_code, country, status)
VALUES (6, 'Elena', 'Rostova', 'elena.rostova@cloudscale.eu', '+44-20-7946-0912', '12 King William Street', 'London', 'ENG', 'EC4N 7TW', 'UK', 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 3. Insert Products
-- ----------------------------------------------------------------------------
INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (1, 2, 'PROD-LAP-001', 'Apex Pro 16" Creator Laptop', 'M3 Max 36GB RAM, 1TB NVMe PCIe 4.0 SSD, Liquid Retina XDR display', 2499.99, 24, 5, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (2, 2, 'PROD-MON-002', 'UltraVision 34" Curved 4K Monitor', '144Hz IPS Ultrawide with 90W USB-C Power Delivery and built-in KVM switch', 799.50, 18, 4, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (3, 3, 'PROD-AUD-003', 'AcousticShield ANC Wireless Headphones', 'Active noise cancellation with 45-hour battery life and spatial audio support', 299.00, 45, 10, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (4, 3, 'PROD-AUD-004', 'PulseTrack Smartwatch Titan Edition', 'Titanium case, Sapphire glass, continuous ECG, GPS, and 100m water resistance', 349.99, 30, 8, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (5, 2, 'PROD-KEY-005', 'TactileMech Pro Wireless Keyboard', 'Hot-swappable mechanical switches, PBT keycaps, gasket-mounted dampening', 159.00, 60, 15, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (6, 2, 'PROD-MOU-006', 'PrecisionGlide Ergonomic Mouse', '4000 DPI Darkfield sensor, hyper-fast magnetic scroll wheel, USB-C fast charge', 99.00, 75, 15, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (7, 4, 'PROD-DSK-007', 'ErgoLift Electric Dual-Motor Standing Desk', 'Solid walnut desktop, 4 programmable height memory presets, 300 lbs load capacity', 580.00, 12, 3, 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (8, 4, 'PROD-CHR-008', 'MeshMatrix Ergonomic Task Chair', 'Multi-dimensional lumbar support, 4D armrests, breathable elastomeric mesh', 420.00, 15, 3, 'https://images.unsplash.com/photo-1580481077195-c3a82145d875?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (9, 5, 'PROD-BOK-009', 'Oracle 21c Database Administration Handbook', 'Comprehensive guide to Oracle architecture, performance tuning, and Multitenant PDBs', 89.99, 50, 10, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (10, 5, 'PROD-BOK-010', 'High-Performance SQL Tuning & Execution Plans', 'Mastering the Oracle Cost-Based Optimizer (CBO), histogram stats, and execution plans', 74.50, 35, 8, 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (11, 6, 'PROD-BAG-011', 'Nomad Techpack 28L Weatherproof Backpack', 'Ballistic nylon, dedicated padded 16" laptop sleeve, TSA-approved checkpoint design', 139.00, 28, 5, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 1);

INSERT INTO products (product_id, category_id, sku, name, description, price, stock_quantity, reorder_level, image_url, is_active)
VALUES (12, 1, 'PROD-HUB-012', 'Thunderbolt 4 10-in-1 Docking Station', 'Dual 4K@60Hz display support, 100W PD charging, Gigabit Ethernet, SD 4.0 card reader', 189.00, 22, 5, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500', 1);

-- ----------------------------------------------------------------------------
-- 4. Insert Orders
-- ----------------------------------------------------------------------------
INSERT INTO orders (order_id, customer_id, order_date, total_amount, status, shipping_address, payment_method, payment_status)
VALUES (101, 1, SYSTIMESTAMP - INTERVAL '14' DAY, 3298.99, 'DELIVERED', '400 Oracle Parkway, Suite 1200, Redwood City, CA 94065', 'CREDIT_CARD', 'PAID');

INSERT INTO orders (order_id, customer_id, order_date, total_amount, status, shipping_address, payment_method, payment_status)
VALUES (102, 1, SYSTIMESTAMP - INTERVAL '5' DAY, 164.49, 'DELIVERED', '400 Oracle Parkway, Suite 1200, Redwood City, CA 94065', 'CREDIT_CARD', 'PAID');

INSERT INTO orders (order_id, customer_id, order_date, total_amount, status, shipping_address, payment_method, payment_status)
VALUES (103, 2, SYSTIMESTAMP - INTERVAL '8' DAY, 1219.50, 'SHIPPED', '742 Evergreen Terrace, Seattle, WA 98101', 'PAYPAL', 'PAID');

INSERT INTO orders (order_id, customer_id, order_date, total_amount, status, shipping_address, payment_method, payment_status)
VALUES (104, 3, SYSTIMESTAMP - INTERVAL '3' DAY, 1000.00, 'PROCESSING', '1100 Silicon Hills Blvd, Austin, TX 78701', 'NET_BANKING', 'PAID');

INSERT INTO orders (order_id, customer_id, order_date, total_amount, status, shipping_address, payment_method, payment_status)
VALUES (105, 4, SYSTIMESTAMP - INTERVAL '2' DAY, 648.99, 'PROCESSING', 'Plot 42, Hitec City Phase 2, Hyderabad, TS 500081', 'CREDIT_CARD', 'PAID');

INSERT INTO orders (order_id, customer_id, order_date, total_amount, status, shipping_address, payment_method, payment_status)
VALUES (106, 5, SYSTIMESTAMP - INTERVAL '1' DAY, 258.00, 'PENDING', '88 Innovation Way, Boston, MA 02110', 'DEBIT_CARD', 'PENDING');

INSERT INTO orders (order_id, customer_id, order_date, total_amount, status, shipping_address, payment_method, payment_status)
VALUES (107, 1, SYSTIMESTAMP - INTERVAL '2' HOUR, 488.99, 'PENDING', '400 Oracle Parkway, Suite 1200, Redwood City, CA 94065', 'CREDIT_CARD', 'PENDING');

-- ----------------------------------------------------------------------------
-- 5. Insert Order Items
-- ----------------------------------------------------------------------------
-- Order 101 (Alex Wright)
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1001, 101, 1, 1, 2499.99, 2499.99);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1002, 101, 2, 1, 799.00, 799.00);

-- Order 102 (Alex Wright)
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1003, 102, 9, 1, 89.99, 89.99);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1004, 102, 10, 1, 74.50, 74.50);

-- Order 103 (Samantha Miller)
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1005, 103, 2, 1, 799.50, 799.50);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1006, 103, 8, 1, 420.00, 420.00);

-- Order 104 (Devon Chen)
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1007, 104, 7, 1, 580.00, 580.00);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1008, 104, 8, 1, 420.00, 420.00);

-- Order 105 (Priya Sharma)
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1009, 105, 3, 1, 299.00, 299.00);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1010, 105, 4, 1, 349.99, 349.99);

-- Order 106 (Marcus Vance)
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1011, 106, 5, 1, 159.00, 159.00);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1012, 106, 6, 1, 99.00, 99.00);

-- Order 107 (Alex Wright - Recent pending)
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1013, 107, 4, 1, 349.99, 349.99);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1014, 107, 11, 1, 139.00, 139.00);

COMMIT;
