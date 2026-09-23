const express = require('express');
const router = express.Router();
const { executeQuery, getDatabaseStatus, getMemoryFallback } = require('../db');

// GET /api/categories - list all categories with product count
router.get('/', async (req, res) => {
  try {
    const status = getDatabaseStatus();
    if (status.connected) {
      const sql = `
        SELECT 
          c.category_id,
          c.category_name,
          c.description,
          c.parent_category_id,
          c.is_active,
          COUNT(p.product_id) AS product_count
        FROM categories c
        LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
        WHERE c.is_active = 1
        GROUP BY c.category_id, c.category_name, c.description, c.parent_category_id, c.is_active
        ORDER BY c.category_id ASC
      `;
      const result = await executeQuery(sql);
      return res.json({ success: true, data: result.rows, source: 'ORACLE_21C' });
    } else {
      const fb = getMemoryFallback();
      const categoriesWithCount = fb.categories.map(cat => ({
        CATEGORY_ID: cat.CATEGORY_ID,
        CATEGORY_NAME: cat.CATEGORY_NAME,
        DESCRIPTION: cat.DESCRIPTION,
        PARENT_CATEGORY_ID: cat.PARENT_CATEGORY_ID,
        IS_ACTIVE: cat.IS_ACTIVE,
        PRODUCT_COUNT: fb.products.filter(p => p.CATEGORY_ID === cat.CATEGORY_ID).length
      }));
      return res.json({ success: true, data: categoriesWithCount, source: 'FALLBACK' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
