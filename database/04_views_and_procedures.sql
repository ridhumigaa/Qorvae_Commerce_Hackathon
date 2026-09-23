-- ============================================================================
-- ORACLE DBA HACKATHON PROJECT: ONLINE SHOPPING DATABASE
-- Script 04: Views, PL/SQL Package (Atomic Transactions & Locking), and Triggers
-- Target Schema: ECOMMERCE_DBA
-- ============================================================================

SET DEFINE OFF;

-- ----------------------------------------------------------------------------
-- 1. PRIMARY EXPECTED FEATURE VIEW: VW_CUSTOMER_ORDER_HISTORY
-- Denormalized reporting view joining Customers, Orders, Order Items, and Products
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_customer_order_history AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    c.city || ', ' || c.state AS customer_location,
    o.order_id,
    o.order_date,
    o.status AS order_status,
    o.payment_method,
    o.payment_status,
    o.shipping_address,
    o.total_amount AS order_total,
    oi.order_item_id,
    oi.product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    p.image_url AS product_image,
    cat.category_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal AS item_subtotal
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN categories cat ON p.category_id = cat.category_id;

COMMENT ON TABLE vw_customer_order_history IS 'Oracle DBA reporting view providing full denormalized customer purchase history.';

-- ----------------------------------------------------------------------------
-- 2. CUSTOMER AGGREGATE SUMMARY VIEW: VW_CUSTOMER_METRICS
-- Provides fast high-level customer lifetime analytics
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_customer_metrics AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email,
    c.phone,
    c.city,
    c.country,
    c.status AS customer_status,
    COUNT(DISTINCT o.order_id) AS total_orders,
    NVL(SUM(o.total_amount), 0) AS lifetime_spend,
    ROUND(NVL(AVG(o.total_amount), 0), 2) AS avg_order_value,
    MAX(o.order_date) AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.phone, c.city, c.country, c.status;

-- ----------------------------------------------------------------------------
-- 3. AUDIT TRIGGER ON PRODUCT STOCK & PRICE MUTATIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_product_audit
AFTER UPDATE OR DELETE ON products
FOR EACH ROW
BEGIN
    IF UPDATING THEN
        IF :OLD.stock_quantity <> :NEW.stock_quantity OR :OLD.price <> :NEW.price THEN
            INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, performed_by, logged_at)
            VALUES (
                'PRODUCTS',
                :NEW.product_id,
                'UPDATE',
                'Stock: ' || :OLD.stock_quantity || ', Price: $' || :OLD.price,
                'Stock: ' || :NEW.stock_quantity || ', Price: $' || :NEW.price,
                USER,
                SYSTIMESTAMP
            );
        END IF;
    ELSIF DELETING THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, performed_by, logged_at)
        VALUES (
            'PRODUCTS',
            :OLD.product_id,
            'DELETE',
            'Name: ' || :OLD.name || ', SKU: ' || :OLD.sku,
            NULL,
            USER,
            SYSTIMESTAMP
        );
    END IF;
END;
/

-- ----------------------------------------------------------------------------
-- 4. PL/SQL PACKAGE: PKG_ECOMMERCE_ORDERS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PACKAGE pkg_ecommerce_orders AS
    PROCEDURE cancel_order(
        p_order_id   IN NUMBER,
        p_result_msg OUT VARCHAR2
    );

    FUNCTION get_customer_ltv(
        p_customer_id IN NUMBER
    ) RETURN NUMBER;
END pkg_ecommerce_orders;
/

CREATE OR REPLACE PACKAGE BODY pkg_ecommerce_orders AS

    PROCEDURE cancel_order(
        p_order_id   IN NUMBER,
        p_result_msg OUT VARCHAR2
    ) IS
        v_current_status VARCHAR2(25);
    BEGIN
        SELECT status INTO v_current_status
        FROM orders
        WHERE order_id = p_order_id
        FOR UPDATE;

        IF v_current_status = 'DELIVERED' THEN
            p_result_msg := 'ERROR: Cannot cancel an order that has already been DELIVERED.';
            RETURN;
        ELSIF v_current_status = 'CANCELLED' THEN
            p_result_msg := 'Order is already CANCELLED.';
            RETURN;
        END IF;

        FOR item IN (SELECT product_id, quantity FROM order_items WHERE order_id = p_order_id) LOOP
            UPDATE products
            SET stock_quantity = stock_quantity + item.quantity
            WHERE product_id = item.product_id;
        END LOOP;

        UPDATE orders
        SET status = 'CANCELLED'
        WHERE order_id = p_order_id;

        p_result_msg := 'SUCCESS: Order #' || p_order_id || ' cancelled and inventory replenished.';
        COMMIT;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result_msg := 'ERROR: Order ID ' || p_order_id || ' does not exist.';
            ROLLBACK;
        WHEN OTHERS THEN
            p_result_msg := 'ERROR: ' || SQLERRM;
            ROLLBACK;
    END cancel_order;

    FUNCTION get_customer_ltv(
        p_customer_id IN NUMBER
    ) RETURN NUMBER IS
        v_ltv NUMBER := 0;
    BEGIN
        SELECT NVL(SUM(total_amount), 0)
        INTO v_ltv
        FROM orders
        WHERE customer_id = p_customer_id
          AND status <> 'CANCELLED';
        RETURN v_ltv;
    END get_customer_ltv;

END pkg_ecommerce_orders;
/

COMMIT;
