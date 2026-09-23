const express = require('express');
const router = express.Router();
const { executeQuery, getDatabaseStatus, getMemoryFallback } = require('../db');

// GET /api/customers - list customers with aggregated lifetime order metrics
router.get('/', async (req, res) => {
  try {
    const status = getDatabaseStatus();

    if (status.connected) {
      const sql = `
        SELECT 
          c.customer_id,
          c.first_name,
          c.last_name,
          c.first_name || ' ' || c.last_name AS customer_name,
          c.email,
          c.phone,
          c.address,
          c.city,
          c.state,
          c.postal_code,
          c.country,
          c.status,
          c.created_at,
          NVL(m.total_orders, 0) AS total_orders,
          NVL(m.lifetime_spend, 0) AS lifetime_spend,
          NVL(m.avg_order_value, 0) AS avg_order_value,
          m.last_order_date
        FROM customers c
        LEFT JOIN vw_customer_metrics m ON c.customer_id = m.customer_id
        ORDER BY c.customer_id ASC
      `;
      const result = await executeQuery(sql);
      return res.json({ success: true, count: result.rows.length, data: result.rows, source: 'ORACLE_21C' });
    } else {
      const fb = getMemoryFallback();
      const rows = fb.customers.map(c => {
        const userOrders = fb.orders.filter(o => o.CUSTOMER_ID === c.CUSTOMER_ID);
        const totalOrders = userOrders.length;
        const lifetimeSpend = userOrders.reduce((acc, o) => acc + (o.STATUS !== 'CANCELLED' ? o.TOTAL_AMOUNT : 0), 0);
        const avgVal = totalOrders > 0 ? (lifetimeSpend / totalOrders).toFixed(2) : 0;
        const lastOrder = userOrders.length > 0 ? userOrders.sort((a,b) => new Date(b.ORDER_DATE) - new Date(a.ORDER_DATE))[0].ORDER_DATE : null;

        return {
          CUSTOMER_ID: c.CUSTOMER_ID,
          FIRST_NAME: c.FIRST_NAME,
          LAST_NAME: c.LAST_NAME,
          CUSTOMER_NAME: `${c.FIRST_NAME} ${c.LAST_NAME}`,
          EMAIL: c.EMAIL,
          PHONE: c.PHONE,
          ADDRESS: c.ADDRESS,
          CITY: c.CITY,
          STATE: c.STATE,
          POSTAL_CODE: c.POSTAL_CODE,
          COUNTRY: c.COUNTRY,
          STATUS: c.STATUS,
          TOTAL_ORDERS: totalOrders,
          LIFETIME_SPEND: lifetimeSpend,
          AVG_ORDER_VALUE: parseFloat(avgVal),
          LAST_ORDER_DATE: lastOrder
        };
      });

      return res.json({ success: true, count: rows.length, data: rows, source: 'FALLBACK' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/customers/:id - single customer profile
router.get('/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const status = getDatabaseStatus();

    if (status.connected) {
      const sql = `
        SELECT c.*, c.first_name || ' ' || c.last_name AS customer_name
        FROM customers c
        WHERE c.customer_id = :id
      `;
      const result = await executeQuery(sql, { id: customerId });
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }
      return res.json({ success: true, data: result.rows[0], source: 'ORACLE_21C' });
    } else {
      const fb = getMemoryFallback();
      const c = fb.customers.find(x => x.CUSTOMER_ID === customerId);
      if (!c) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }
      return res.json({ success: true, data: { ...c, CUSTOMER_NAME: `${c.FIRST_NAME} ${c.LAST_NAME}` }, source: 'FALLBACK' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
