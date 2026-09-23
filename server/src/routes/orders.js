const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const { executeQuery, getDatabaseStatus, getMemoryFallback } = require('../db');

// GET /api/orders - list orders with customer details and line item counts
router.get('/', async (req, res) => {
  try {
    const { status: orderStatus, customer_id } = req.query;
    const status = getDatabaseStatus();

    if (status.connected) {
      let sql = `
        SELECT 
          o.order_id,
          o.customer_id,
          c.first_name || ' ' || c.last_name AS customer_name,
          c.email AS customer_email,
          o.order_date,
          o.total_amount,
          o.status,
          o.shipping_address,
          o.payment_method,
          o.payment_status,
          COUNT(oi.order_item_id) AS total_items,
          NVL(SUM(oi.quantity), 0) AS total_quantity
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE 1 = 1
      `;
      const binds = {};

      if (orderStatus) {
        sql += ` AND o.status = :orderStatus`;
        binds.orderStatus = orderStatus.toUpperCase();
      }

      if (customer_id) {
        sql += ` AND o.customer_id = :custId`;
        binds.custId = parseInt(customer_id, 10);
      }

      sql += `
        GROUP BY 
          o.order_id, o.customer_id, c.first_name, c.last_name, c.email, 
          o.order_date, o.total_amount, o.status, o.shipping_address, 
          o.payment_method, o.payment_status
        ORDER BY o.order_date DESC
      `;

      const result = await executeQuery(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows, source: 'ORACLE_21C' });
    } else {
      const fb = getMemoryFallback();
      let list = fb.orders;

      if (orderStatus) {
        list = list.filter(o => o.STATUS === orderStatus.toUpperCase());
      }
      if (customer_id) {
        list = list.filter(o => o.CUSTOMER_ID === parseInt(customer_id, 10));
      }

      const rows = list.map(o => {
        const c = fb.customers.find(x => x.CUSTOMER_ID === o.CUSTOMER_ID) || {};
        const items = fb.orderItems.filter(oi => oi.ORDER_ID === o.ORDER_ID);
        return {
          ORDER_ID: o.ORDER_ID,
          CUSTOMER_ID: o.CUSTOMER_ID,
          CUSTOMER_NAME: `${c.FIRST_NAME || ''} ${c.LAST_NAME || ''}`.trim(),
          CUSTOMER_EMAIL: c.EMAIL,
          ORDER_DATE: o.ORDER_DATE,
          TOTAL_AMOUNT: o.TOTAL_AMOUNT,
          STATUS: o.STATUS,
          SHIPPING_ADDRESS: o.SHIPPING_ADDRESS,
          PAYMENT_METHOD: o.PAYMENT_METHOD,
          PAYMENT_STATUS: o.PAYMENT_STATUS,
          TOTAL_ITEMS: items.length,
          TOTAL_QUANTITY: items.reduce((acc, i) => acc + i.QUANTITY, 0)
        };
      });

      return res.json({ success: true, count: rows.length, data: rows, source: 'FALLBACK' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id - get full order details including line items
router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const status = getDatabaseStatus();

    if (status.connected) {
      const orderSql = `
        SELECT o.*, c.first_name || ' ' || c.last_name AS customer_name, c.email, c.phone
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        WHERE o.order_id = :id
      `;
      const orderRes = await executeQuery(orderSql, { id: orderId });
      if (orderRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const itemsSql = `
        SELECT 
          oi.order_item_id,
          oi.product_id,
          p.name AS product_name,
          p.sku AS product_sku,
          p.image_url AS product_image,
          c.category_name,
          oi.quantity,
          oi.unit_price,
          oi.subtotal
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN categories c ON p.category_id = c.category_id
        WHERE oi.order_id = :id
        ORDER BY oi.order_item_id ASC
      `;
      const itemsRes = await executeQuery(itemsSql, { id: orderId });

      return res.json({
        success: true,
        data: {
          ...orderRes.rows[0],
          items: itemsRes.rows
        },
        source: 'ORACLE_21C'
      });
    } else {
      const fb = getMemoryFallback();
      const o = fb.orders.find(x => x.ORDER_ID === orderId);
      if (!o) return res.status(404).json({ success: false, error: 'Order not found' });

      const c = fb.customers.find(x => x.CUSTOMER_ID === o.CUSTOMER_ID) || {};
      const items = fb.orderItems.filter(x => x.ORDER_ID === orderId).map(oi => {
        const p = fb.products.find(x => x.PRODUCT_ID === oi.PRODUCT_ID) || {};
        return {
          ORDER_ITEM_ID: oi.ORDER_ITEM_ID,
          PRODUCT_ID: oi.PRODUCT_ID,
          PRODUCT_NAME: p.NAME,
          PRODUCT_SKU: p.SKU,
          PRODUCT_IMAGE: p.IMAGE_URL,
          CATEGORY_NAME: p.CATEGORY_NAME,
          QUANTITY: oi.QUANTITY,
          UNIT_PRICE: oi.UNIT_PRICE,
          SUBTOTAL: oi.SUBTOTAL
        };
      });

      return res.json({
        success: true,
        data: {
          ...o,
          CUSTOMER_NAME: `${c.FIRST_NAME || ''} ${c.LAST_NAME || ''}`.trim(),
          EMAIL: c.EMAIL,
          PHONE: c.PHONE,
          items
        },
        source: 'FALLBACK'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders - atomic checkout transaction
router.post('/', async (req, res) => {
  const { customer_id, shipping_address, payment_method, items } = req.body;

  if (!customer_id || !shipping_address || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Customer ID, shipping address, and at least one item are required.' });
  }

  const status = getDatabaseStatus();

  if (status.connected) {
    // In Oracle, perform atomic transaction
    try {
      // 1. Calculate total and verify inventory
      let totalAmount = 0;
      const verifiedItems = [];

      for (const item of items) {
        const prodRes = await executeQuery(
          `SELECT product_id, name, price, stock_quantity FROM products WHERE product_id = :id FOR UPDATE`,
          { id: item.product_id }
        );

        if (prodRes.rows.length === 0) {
          return res.status(400).json({ success: false, error: `Product ID #${item.product_id} not found.` });
        }

        const prod = prodRes.rows[0];
        if (prod.STOCK_QUANTITY < item.quantity) {
          return res.status(400).json({ 
            success: false, 
            error: `Insufficient stock for "${prod.NAME}". Requested: ${item.quantity}, Available: ${prod.STOCK_QUANTITY}` 
          });
        }

        const subtotal = Number((prod.PRICE * item.quantity).toFixed(2));
        totalAmount += subtotal;

        verifiedItems.push({
          product_id: prod.PRODUCT_ID,
          name: prod.NAME,
          quantity: item.quantity,
          unit_price: prod.PRICE,
          subtotal
        });
      }

      totalAmount = Number(totalAmount.toFixed(2));

      // 2. Insert Order and retrieve generated order_id
      const insertOrderSql = `
        INSERT INTO orders (customer_id, order_date, total_amount, status, shipping_address, payment_method, payment_status)
        VALUES (:customer_id, SYSTIMESTAMP, :total_amount, 'PROCESSING', :shipping_address, :payment_method, 'PAID')
        RETURNING order_id INTO :new_order_id
      `;
      const orderBinds = {
        customer_id: parseInt(customer_id, 10),
        total_amount: totalAmount,
        shipping_address,
        payment_method: payment_method || 'CREDIT_CARD',
        new_order_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      };

      const orderResult = await executeQuery(insertOrderSql, orderBinds);
      const newOrderId = orderResult.outBinds.new_order_id[0];

      // 3. Insert items and decrement stock
      for (const vi of verifiedItems) {
        await executeQuery(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
           VALUES (:order_id, :product_id, :quantity, :unit_price, :subtotal)`,
          {
            order_id: newOrderId,
            product_id: vi.product_id,
            quantity: vi.quantity,
            unit_price: vi.unit_price,
            subtotal: vi.subtotal
          }
        );

        await executeQuery(
          `UPDATE products SET stock_quantity = stock_quantity - :qty WHERE product_id = :id`,
          { qty: vi.quantity, id: vi.product_id }
        );
      }

      return res.status(201).json({
        success: true,
        message: 'Order created successfully with Oracle ACID transaction guarantees.',
        order_id: newOrderId,
        total_amount: totalAmount,
        item_count: verifiedItems.length,
        source: 'ORACLE_21C'
      });
    } catch (err) {
      console.error('[Order Placement Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    // Fallback mode transaction
    const fb = getMemoryFallback();
    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of items) {
      const p = fb.products.find(x => x.PRODUCT_ID === item.product_id);
      if (!p) return res.status(400).json({ success: false, error: `Product ID #${item.product_id} not found.` });
      if (p.STOCK_QUANTITY < item.quantity) {
        return res.status(400).json({ success: false, error: `Insufficient stock for "${p.NAME}".` });
      }
      const subtotal = Number((p.PRICE * item.quantity).toFixed(2));
      totalAmount += subtotal;
      verifiedItems.push({ product_id: p.PRODUCT_ID, quantity: item.quantity, unit_price: p.PRICE, subtotal });
    }

    const newOrderId = 200 + fb.orders.length;
    fb.orders.unshift({
      ORDER_ID: newOrderId,
      CUSTOMER_ID: parseInt(customer_id, 10),
      ORDER_DATE: new Date().toISOString(),
      TOTAL_AMOUNT: Number(totalAmount.toFixed(2)),
      STATUS: 'PROCESSING',
      SHIPPING_ADDRESS: shipping_address,
      PAYMENT_METHOD: payment_method || 'CREDIT_CARD',
      PAYMENT_STATUS: 'PAID'
    });

    let itemIdSeq = 2000 + fb.orderItems.length;
    for (const vi of verifiedItems) {
      fb.orderItems.push({
        ORDER_ITEM_ID: itemIdSeq++,
        ORDER_ID: newOrderId,
        PRODUCT_ID: vi.product_id,
        QUANTITY: vi.quantity,
        UNIT_PRICE: vi.unit_price,
        SUBTOTAL: vi.subtotal
      });
      const prod = fb.products.find(x => x.PRODUCT_ID === vi.product_id);
      if (prod) prod.STOCK_QUANTITY -= vi.quantity;
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully (fallback mode).',
      order_id: newOrderId,
      total_amount: Number(totalAmount.toFixed(2)),
      source: 'FALLBACK'
    });
  }
});

// PUT /api/orders/:id/status - update status or cancel
router.put('/:id/status', async (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  const { status: newStatus } = req.body;

  if (!newStatus) {
    return res.status(400).json({ success: false, error: 'Status is required' });
  }

  const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(newStatus.toUpperCase())) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const status = getDatabaseStatus();

  if (status.connected) {
    try {
      if (newStatus.toUpperCase() === 'CANCELLED') {
        // Execute PL/SQL package procedure pkg_ecommerce_orders.cancel_order
        const plsql = `
          BEGIN
            pkg_ecommerce_orders.cancel_order(:p_order_id, :p_result_msg);
          END;
        `;
        const binds = {
          p_order_id: orderId,
          p_result_msg: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 500 }
        };
        const result = await executeQuery(plsql, binds);
        const resultMsg = result.outBinds.p_result_msg;

        if (resultMsg.startsWith('ERROR')) {
          return res.status(400).json({ success: false, error: resultMsg });
        }
        return res.json({ success: true, message: resultMsg, source: 'ORACLE_PLSQL' });
      } else {
        await executeQuery(
          `UPDATE orders SET status = :status WHERE order_id = :id`,
          { status: newStatus.toUpperCase(), id: orderId }
        );
        return res.json({ success: true, message: `Order #${orderId} status updated to ${newStatus}` });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const fb = getMemoryFallback();
    const o = fb.orders.find(x => x.ORDER_ID === orderId);
    if (!o) return res.status(404).json({ success: false, error: 'Order not found' });

    if (newStatus.toUpperCase() === 'CANCELLED' && o.STATUS !== 'CANCELLED') {
      const items = fb.orderItems.filter(x => x.ORDER_ID === orderId);
      for (const item of items) {
        const p = fb.products.find(x => x.PRODUCT_ID === item.PRODUCT_ID);
        if (p) p.STOCK_QUANTITY += item.QUANTITY;
      }
    }
    o.STATUS = newStatus.toUpperCase();
    return res.json({ success: true, message: `Order #${orderId} status set to ${newStatus}` });
  }
});

module.exports = router;
