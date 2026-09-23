const express = require('express');
const router = express.Router();
const { executeQuery, getDatabaseStatus, getMemoryFallback } = require('../db');

// GET /api/order-history - queries VW_CUSTOMER_ORDER_HISTORY with filtering and grouping
router.get('/', async (req, res) => {
  try {
    const { customer_id, search, status: orderStatus, raw } = req.query;
    const dbStatus = getDatabaseStatus();

    let rows = [];

    if (dbStatus.connected) {
      let sql = `
        SELECT 
          customer_id,
          customer_name,
          customer_email,
          customer_phone,
          customer_location,
          order_id,
          order_date,
          order_status,
          payment_method,
          payment_status,
          shipping_address,
          order_total,
          order_item_id,
          product_id,
          product_name,
          product_sku,
          product_image,
          category_name,
          quantity,
          unit_price,
          item_subtotal
        FROM vw_customer_order_history
        WHERE 1 = 1
      `;
      const binds = {};

      if (customer_id) {
        sql += ` AND customer_id = :custId`;
        binds.custId = parseInt(customer_id, 10);
      }

      if (orderStatus) {
        sql += ` AND order_status = :ordStatus`;
        binds.ordStatus = orderStatus.toUpperCase();
      }

      if (search) {
        sql += ` AND (
          LOWER(product_name) LIKE :q OR 
          LOWER(product_sku) LIKE :q OR 
          LOWER(customer_name) LIKE :q OR 
          LOWER(category_name) LIKE :q OR
          TO_CHAR(order_id) = :exactOrderId
        )`;
        binds.q = `%${search.toLowerCase().trim()}%`;
        binds.exactOrderId = search.trim();
      }

      sql += ` ORDER BY order_date DESC, order_id DESC, order_item_id ASC`;

      const result = await executeQuery(sql, binds);
      rows = result.rows;
    } else {
      // Fallback query against memory
      const fb = getMemoryFallback();
      let allHistory = [];
      for (const c of fb.customers) {
        const custOrders = fb.orders.filter(o => o.CUSTOMER_ID === c.CUSTOMER_ID);
        for (const o of custOrders) {
          const items = fb.orderItems.filter(oi => oi.ORDER_ID === o.ORDER_ID);
          for (const oi of items) {
            const prod = fb.products.find(p => p.PRODUCT_ID === oi.PRODUCT_ID) || {};
            allHistory.push({
              CUSTOMER_ID: c.CUSTOMER_ID,
              CUSTOMER_NAME: `${c.FIRST_NAME} ${c.LAST_NAME}`,
              CUSTOMER_EMAIL: c.EMAIL,
              CUSTOMER_PHONE: c.PHONE,
              CUSTOMER_LOCATION: `${c.CITY}, ${c.STATE}`,
              ORDER_ID: o.ORDER_ID,
              ORDER_DATE: o.ORDER_DATE,
              ORDER_STATUS: o.STATUS,
              PAYMENT_METHOD: o.PAYMENT_METHOD,
              PAYMENT_STATUS: o.PAYMENT_STATUS,
              SHIPPING_ADDRESS: o.SHIPPING_ADDRESS,
              ORDER_TOTAL: o.TOTAL_AMOUNT,
              ORDER_ITEM_ID: oi.ORDER_ITEM_ID,
              PRODUCT_ID: oi.PRODUCT_ID,
              PRODUCT_NAME: prod.NAME,
              PRODUCT_SKU: prod.SKU,
              PRODUCT_IMAGE: prod.IMAGE_URL,
              CATEGORY_NAME: prod.CATEGORY_NAME,
              QUANTITY: oi.QUANTITY,
              UNIT_PRICE: oi.UNIT_PRICE,
              ITEM_SUBTOTAL: oi.SUBTOTAL
            });
          }
        }
      }

      if (customer_id) {
        allHistory = allHistory.filter(h => h.CUSTOMER_ID === parseInt(customer_id, 10));
      }
      if (orderStatus) {
        allHistory = allHistory.filter(h => h.ORDER_STATUS === orderStatus.toUpperCase());
      }
      if (search) {
        const q = search.toLowerCase().trim();
        allHistory = allHistory.filter(h => 
          (h.PRODUCT_NAME && h.PRODUCT_NAME.toLowerCase().includes(q)) ||
          (h.PRODUCT_SKU && h.PRODUCT_SKU.toLowerCase().includes(q)) ||
          (h.CUSTOMER_NAME && h.CUSTOMER_NAME.toLowerCase().includes(q)) ||
          (h.CATEGORY_NAME && h.CATEGORY_NAME.toLowerCase().includes(q)) ||
          String(h.ORDER_ID) === q
        );
      }
      rows = allHistory.sort((a,b) => new Date(b.ORDER_DATE) - new Date(a.ORDER_DATE));
    }

    // If client specifically requests raw tabular rows (e.g. for DBA view display)
    if (raw === 'true') {
      return res.json({ success: true, count: rows.length, data: rows, view: 'VW_CUSTOMER_ORDER_HISTORY' });
    }

    // Group rows into Orders for rich frontend timeline rendering
    const orderMap = new Map();
    for (const r of rows) {
      if (!orderMap.has(r.ORDER_ID)) {
        orderMap.set(r.ORDER_ID, {
          order_id: r.ORDER_ID,
          customer_id: r.CUSTOMER_ID,
          customer_name: r.CUSTOMER_NAME,
          customer_email: r.CUSTOMER_EMAIL,
          customer_phone: r.CUSTOMER_PHONE,
          customer_location: r.CUSTOMER_LOCATION,
          order_date: r.ORDER_DATE,
          order_status: r.ORDER_STATUS,
          order_total: r.ORDER_TOTAL,
          payment_method: r.PAYMENT_METHOD,
          payment_status: r.PAYMENT_STATUS,
          shipping_address: r.SHIPPING_ADDRESS,
          items: []
        });
      }
      orderMap.get(r.ORDER_ID).items.push({
        order_item_id: r.ORDER_ITEM_ID,
        product_id: r.PRODUCT_ID,
        product_name: r.PRODUCT_NAME,
        product_sku: r.PRODUCT_SKU,
        product_image: r.PRODUCT_IMAGE,
        category_name: r.CATEGORY_NAME,
        quantity: r.QUANTITY,
        unit_price: r.UNIT_PRICE,
        subtotal: r.ITEM_SUBTOTAL
      });
    }

    const groupedOrders = Array.from(orderMap.values());

    return res.json({
      success: true,
      total_orders: groupedOrders.length,
      total_line_items: rows.length,
      orders: groupedOrders,
      source: dbStatus.connected ? 'ORACLE_VIEW_VW_CUSTOMER_ORDER_HISTORY' : 'FALLBACK_VIEW'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/order-history/customer/:id/summary - specific customer lifetime metrics
router.get('/customer/:id/summary', async (req, res) => {
  try {
    const custId = parseInt(req.params.id, 10);
    const dbStatus = getDatabaseStatus();

    if (dbStatus.connected) {
      const sql = `SELECT * FROM vw_customer_metrics WHERE customer_id = :id`;
      const result = await executeQuery(sql, { id: custId });
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }
      return res.json({ success: true, data: result.rows[0], source: 'ORACLE_21C' });
    } else {
      const fb = getMemoryFallback();
      const c = fb.customers.find(x => x.CUSTOMER_ID === custId);
      if (!c) return res.status(404).json({ success: false, error: 'Customer not found' });

      const orders = fb.orders.filter(o => o.CUSTOMER_ID === custId);
      const totalOrders = orders.length;
      const lifetimeSpend = orders.reduce((sum, o) => sum + (o.STATUS !== 'CANCELLED' ? o.TOTAL_AMOUNT : 0), 0);

      return res.json({
        success: true,
        data: {
          CUSTOMER_ID: c.CUSTOMER_ID,
          CUSTOMER_NAME: `${c.FIRST_NAME} ${c.LAST_NAME}`,
          EMAIL: c.EMAIL,
          PHONE: c.PHONE,
          CITY: c.CITY,
          COUNTRY: c.COUNTRY,
          TOTAL_ORDERS: totalOrders,
          LIFETIME_SPEND: lifetimeSpend,
          AVG_ORDER_VALUE: totalOrders > 0 ? (lifetimeSpend / totalOrders).toFixed(2) : 0
        },
        source: 'FALLBACK'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
