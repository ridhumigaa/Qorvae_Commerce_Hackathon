const express = require('express');
const router = express.Router();
const { executeQuery, getDatabaseStatus, getMemoryFallback } = require('../db');

// GET /api/products - list products with optional category, search, and low-stock filters
router.get('/', async (req, res) => {
  try {
    const { category_id, search, low_stock } = req.query;
    const status = getDatabaseStatus();

    if (status.connected) {
      let sql = `
        SELECT 
          p.product_id,
          p.category_id,
          c.category_name,
          p.sku,
          p.name,
          p.description,
          p.price,
          p.stock_quantity,
          p.reorder_level,
          p.image_url,
          p.is_active,
          p.created_at,
          CASE WHEN p.stock_quantity <= p.reorder_level THEN 1 ELSE 0 END AS is_low_stock
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        WHERE p.is_active = 1
      `;
      const binds = {};

      if (category_id) {
        sql += ` AND p.category_id = :cat_id`;
        binds.cat_id = parseInt(category_id, 10);
      }

      if (search) {
        sql += ` AND (LOWER(p.name) LIKE :searchTerm OR LOWER(p.sku) LIKE :searchTerm OR LOWER(p.description) LIKE :searchTerm)`;
        binds.searchTerm = `%${search.toLowerCase().trim()}%`;
      }

      if (low_stock === 'true') {
        sql += ` AND p.stock_quantity <= p.reorder_level`;
      }

      sql += ` ORDER BY p.product_id ASC`;

      const result = await executeQuery(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows, source: 'ORACLE_21C' });
    } else {
      const fb = getMemoryFallback();
      let list = fb.products.filter(p => p.IS_ACTIVE === 1);

      if (category_id) {
        list = list.filter(p => p.CATEGORY_ID === parseInt(category_id, 10));
      }

      if (search) {
        const q = search.toLowerCase().trim();
        list = list.filter(p => 
          p.NAME.toLowerCase().includes(q) || 
          p.SKU.toLowerCase().includes(q) || 
          (p.DESCRIPTION && p.DESCRIPTION.toLowerCase().includes(q))
        );
      }

      if (low_stock === 'true') {
        list = list.filter(p => p.STOCK_QUANTITY <= p.REORDER_LEVEL);
      }

      const formatted = list.map(p => ({
        ...p,
        IS_LOW_STOCK: p.STOCK_QUANTITY <= p.REORDER_LEVEL ? 1 : 0
      }));

      return res.json({ success: true, count: formatted.length, data: formatted, source: 'FALLBACK' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id - single product details
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const status = getDatabaseStatus();

    if (status.connected) {
      const sql = `
        SELECT p.*, c.category_name 
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_id = :id
      `;
      const result = await executeQuery(sql, { id: productId });
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      return res.json({ success: true, data: result.rows[0], source: 'ORACLE_21C' });
    } else {
      const fb = getMemoryFallback();
      const prod = fb.products.find(p => p.PRODUCT_ID === productId);
      if (!prod) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      return res.json({ success: true, data: prod, source: 'FALLBACK' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/products/:id/stock - update product inventory (fires DBA audit trigger)
router.put('/:id/stock', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const { stock_quantity } = req.body;
    if (stock_quantity === undefined || stock_quantity < 0) {
      return res.status(400).json({ success: false, error: 'Invalid stock quantity' });
    }

    const status = getDatabaseStatus();
    if (status.connected) {
      const sql = `UPDATE products SET stock_quantity = :stock WHERE product_id = :id`;
      await executeQuery(sql, { stock: parseInt(stock_quantity, 10), id: productId });
      return res.json({ success: true, message: `Product #${productId} inventory updated to ${stock_quantity}` });
    } else {
      const fb = getMemoryFallback();
      const p = fb.products.find(x => x.PRODUCT_ID === productId);
      if (p) p.STOCK_QUANTITY = parseInt(stock_quantity, 10);
      return res.json({ success: true, message: `Product #${productId} inventory updated (fallback)` });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
