let oracledb = null;
try {
  oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
} catch (e) {
  console.log('[OracleDB] Running in Serverless/Cloud environment without native oracledb library.');
}

const path = require('path');
const fs = require('fs');

let pool = null;
let isConnected = false;
let connectionError = null;

// Dual-mode fallback in-memory cache if Oracle service is stopped
let memoryFallbackData = null;
initFallbackData();

async function initOraclePool() {
  if (process.env.VERCEL || !oracledb) {
    isConnected = false;
    connectionError = 'Vercel Cloud Serverless: Intelligent In-Memory Cache active';
    initFallbackData();
    return false;
  }

  const user = process.env.ORACLE_USER || 'ECOMMERCE_DBA';
  const password = process.env.ORACLE_PASSWORD || 'Ecommerce123';
  const connectString = process.env.ORACLE_CONNECT_STRING || 'localhost:1521/XEPDB1';

  try {
    pool = await oracledb.createPool({
      user,
      password,
      connectString,
      poolMin: 1,
      poolMax: 8,
      poolIncrement: 1,
      poolTimeout: 60
    });
    isConnected = true;
    connectionError = null;
    console.log(`[OracleDB] Successfully connected to Oracle 21c XE pool (${connectString}) as ${user}`);
    return true;
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn(`[OracleDB] Warning: Oracle connection failed: ${err.message}. Enabling intelligent fallback mode.`);
    initFallbackData();
    return false;
  }
}

function initFallbackData() {
  if (memoryFallbackData) return;
  memoryFallbackData = {
    categories: [
      { CATEGORY_ID: 1, CATEGORY_NAME: 'Electronics', DESCRIPTION: 'Consumer electronics, gadgets, and cutting-edge devices', PARENT_CATEGORY_ID: null, IS_ACTIVE: 1 },
      { CATEGORY_ID: 2, CATEGORY_NAME: 'Computing', DESCRIPTION: 'Laptops, desktops, monitors, and workstation components', PARENT_CATEGORY_ID: 1, IS_ACTIVE: 1 },
      { CATEGORY_ID: 3, CATEGORY_NAME: 'Audio and Wearables', DESCRIPTION: 'Headphones, smartwatches, and wireless audio equipment', PARENT_CATEGORY_ID: 1, IS_ACTIVE: 1 },
      { CATEGORY_ID: 4, CATEGORY_NAME: 'Home and Office', DESCRIPTION: 'Ergonomic furniture, smart home automation, and accessories', PARENT_CATEGORY_ID: null, IS_ACTIVE: 1 },
      { CATEGORY_ID: 5, CATEGORY_NAME: 'Books and Media', DESCRIPTION: 'Technical literature, database administration guides, and novels', PARENT_CATEGORY_ID: null, IS_ACTIVE: 1 },
      { CATEGORY_ID: 6, CATEGORY_NAME: 'Apparel and Gear', DESCRIPTION: 'Developer hoodies, smart backpacks, and technical clothing', PARENT_CATEGORY_ID: null, IS_ACTIVE: 1 }
    ],
    customers: [
      { CUSTOMER_ID: 1, FIRST_NAME: 'Alexander', LAST_NAME: 'Wright', EMAIL: 'alex.wright@oraclecloud.com', PHONE: '+1-415-555-0101', ADDRESS: '400 Oracle Parkway, Suite 1200', CITY: 'Redwood City', STATE: 'CA', POSTAL_CODE: '94065', COUNTRY: 'USA', STATUS: 'ACTIVE' },
      { CUSTOMER_ID: 2, FIRST_NAME: 'Samantha', LAST_NAME: 'Miller', EMAIL: 'sam.miller@techcorp.io', PHONE: '+1-206-555-0142', ADDRESS: '742 Evergreen Terrace', CITY: 'Seattle', STATE: 'WA', POSTAL_CODE: '98101', COUNTRY: 'USA', STATUS: 'ACTIVE' },
      { CUSTOMER_ID: 3, FIRST_NAME: 'Devon', LAST_NAME: 'Chen', EMAIL: 'devon.chen@dataforge.net', PHONE: '+1-512-555-0189', ADDRESS: '1100 Silicon Hills Blvd', CITY: 'Austin', STATE: 'TX', POSTAL_CODE: '78701', COUNTRY: 'USA', STATUS: 'ACTIVE' },
      { CUSTOMER_ID: 4, FIRST_NAME: 'Priya', LAST_NAME: 'Sharma', EMAIL: 'priya.sharma@cyberinfra.in', PHONE: '+91-98200-12345', ADDRESS: 'Plot 42, Hitec City Phase 2', CITY: 'Hyderabad', STATE: 'TS', POSTAL_CODE: '500081', COUNTRY: 'India', STATUS: 'ACTIVE' },
      { CUSTOMER_ID: 5, FIRST_NAME: 'Marcus', LAST_NAME: 'Vance', EMAIL: 'marcus.vance@quantumlink.org', PHONE: '+1-617-555-0199', ADDRESS: '88 Innovation Way', CITY: 'Boston', STATE: 'MA', POSTAL_CODE: '02110', COUNTRY: 'USA', STATUS: 'ACTIVE' },
      { CUSTOMER_ID: 6, FIRST_NAME: 'Elena', LAST_NAME: 'Rostova', EMAIL: 'elena.rostova@cloudscale.eu', PHONE: '+44-20-7946-0912', ADDRESS: '12 King William Street', CITY: 'London', STATE: 'ENG', POSTAL_CODE: 'EC4N 7TW', COUNTRY: 'UK', STATUS: 'ACTIVE' }
    ],
    products: [
      { PRODUCT_ID: 1, CATEGORY_ID: 2, CATEGORY_NAME: 'Computing', SKU: 'PROD-LAP-001', NAME: 'Apex Pro 16" Creator Laptop', DESCRIPTION: 'M3 Max 36GB RAM, 1TB NVMe PCIe 4.0 SSD, Liquid Retina XDR display', PRICE: 2499.99, STOCK_QUANTITY: 24, REORDER_LEVEL: 5, IMAGE_URL: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 2, CATEGORY_ID: 2, CATEGORY_NAME: 'Computing', SKU: 'PROD-MON-002', NAME: 'UltraVision 34" Curved 4K Monitor', DESCRIPTION: '144Hz IPS Ultrawide with 90W USB-C Power Delivery and built-in KVM switch', PRICE: 799.50, STOCK_QUANTITY: 18, REORDER_LEVEL: 4, IMAGE_URL: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 3, CATEGORY_ID: 3, CATEGORY_NAME: 'Audio and Wearables', SKU: 'PROD-AUD-003', NAME: 'AcousticShield ANC Wireless Headphones', DESCRIPTION: 'Active noise cancellation with 45-hour battery life and spatial audio support', PRICE: 299.00, STOCK_QUANTITY: 45, REORDER_LEVEL: 10, IMAGE_URL: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 4, CATEGORY_ID: 3, CATEGORY_NAME: 'Audio and Wearables', SKU: 'PROD-AUD-004', NAME: 'PulseTrack Smartwatch Titan Edition', DESCRIPTION: 'Titanium case, Sapphire glass, continuous ECG, GPS, and 100m water resistance', PRICE: 349.99, STOCK_QUANTITY: 30, REORDER_LEVEL: 8, IMAGE_URL: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 5, CATEGORY_ID: 2, CATEGORY_NAME: 'Computing', SKU: 'PROD-KEY-005', NAME: 'TactileMech Pro Wireless Keyboard', DESCRIPTION: 'Hot-swappable mechanical switches, PBT keycaps, gasket-mounted dampening', PRICE: 159.00, STOCK_QUANTITY: 60, REORDER_LEVEL: 15, IMAGE_URL: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 6, CATEGORY_ID: 2, CATEGORY_NAME: 'Computing', SKU: 'PROD-MOU-006', NAME: 'PrecisionGlide Ergonomic Mouse', DESCRIPTION: '4000 DPI Darkfield sensor, hyper-fast magnetic scroll wheel, USB-C fast charge', PRICE: 99.00, STOCK_QUANTITY: 75, REORDER_LEVEL: 15, IMAGE_URL: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 7, CATEGORY_ID: 4, CATEGORY_NAME: 'Home and Office', SKU: 'PROD-DSK-007', NAME: 'ErgoLift Electric Dual-Motor Standing Desk', DESCRIPTION: 'Solid walnut desktop, 4 programmable height memory presets, 300 lbs load capacity', PRICE: 580.00, STOCK_QUANTITY: 12, REORDER_LEVEL: 3, IMAGE_URL: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 8, CATEGORY_ID: 4, CATEGORY_NAME: 'Home and Office', SKU: 'PROD-CHR-008', NAME: 'MeshMatrix Ergonomic Task Chair', DESCRIPTION: 'Multi-dimensional lumbar support, 4D armrests, breathable elastomeric mesh', PRICE: 420.00, STOCK_QUANTITY: 15, REORDER_LEVEL: 3, IMAGE_URL: 'https://images.unsplash.com/photo-1580481077195-c3a82145d875?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 9, CATEGORY_ID: 5, CATEGORY_NAME: 'Books and Media', SKU: 'PROD-BOK-009', NAME: 'Oracle 21c Database Administration Handbook', DESCRIPTION: 'Comprehensive guide to Oracle architecture, performance tuning, and Multitenant PDBs', PRICE: 89.99, STOCK_QUANTITY: 50, REORDER_LEVEL: 10, IMAGE_URL: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 10, CATEGORY_ID: 5, CATEGORY_NAME: 'Books and Media', SKU: 'PROD-BOK-010', NAME: 'High-Performance SQL Tuning & Execution Plans', DESCRIPTION: 'Mastering the Oracle Cost-Based Optimizer (CBO), histogram stats, and execution plans', PRICE: 74.50, STOCK_QUANTITY: 35, REORDER_LEVEL: 8, IMAGE_URL: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 11, CATEGORY_ID: 6, CATEGORY_NAME: 'Apparel and Gear', SKU: 'PROD-BAG-011', NAME: 'Nomad Techpack 28L Weatherproof Backpack', DESCRIPTION: 'Ballistic nylon, dedicated padded 16" laptop sleeve, TSA-approved checkpoint design', PRICE: 139.00, STOCK_QUANTITY: 28, REORDER_LEVEL: 5, IMAGE_URL: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', IS_ACTIVE: 1 },
      { PRODUCT_ID: 12, CATEGORY_ID: 1, CATEGORY_NAME: 'Electronics', SKU: 'PROD-HUB-012', NAME: 'Thunderbolt 4 10-in-1 Docking Station', DESCRIPTION: 'Dual 4K@60Hz display support, 100W PD charging, Gigabit Ethernet, SD 4.0 card reader', PRICE: 189.00, STOCK_QUANTITY: 22, REORDER_LEVEL: 5, IMAGE_URL: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500', IS_ACTIVE: 1 }
    ],
    orders: [
      { ORDER_ID: 101, CUSTOMER_ID: 1, ORDER_DATE: new Date(Date.now() - 14 * 86400000).toISOString(), TOTAL_AMOUNT: 3298.99, STATUS: 'DELIVERED', SHIPPING_ADDRESS: '400 Oracle Parkway, Suite 1200, Redwood City, CA 94065', PAYMENT_METHOD: 'CREDIT_CARD', PAYMENT_STATUS: 'PAID' },
      { ORDER_ID: 102, CUSTOMER_ID: 1, ORDER_DATE: new Date(Date.now() - 5 * 86400000).toISOString(), TOTAL_AMOUNT: 164.49, STATUS: 'DELIVERED', SHIPPING_ADDRESS: '400 Oracle Parkway, Suite 1200, Redwood City, CA 94065', PAYMENT_METHOD: 'CREDIT_CARD', PAYMENT_STATUS: 'PAID' },
      { ORDER_ID: 103, CUSTOMER_ID: 2, ORDER_DATE: new Date(Date.now() - 8 * 86400000).toISOString(), TOTAL_AMOUNT: 1219.50, STATUS: 'SHIPPED', SHIPPING_ADDRESS: '742 Evergreen Terrace, Seattle, WA 98101', PAYMENT_METHOD: 'PAYPAL', PAYMENT_STATUS: 'PAID' },
      { ORDER_ID: 104, CUSTOMER_ID: 3, ORDER_DATE: new Date(Date.now() - 3 * 86400000).toISOString(), TOTAL_AMOUNT: 1000.00, STATUS: 'PROCESSING', SHIPPING_ADDRESS: '1100 Silicon Hills Blvd, Austin, TX 78701', PAYMENT_METHOD: 'NET_BANKING', PAYMENT_STATUS: 'PAID' },
      { ORDER_ID: 105, CUSTOMER_ID: 4, ORDER_DATE: new Date(Date.now() - 2 * 86400000).toISOString(), TOTAL_AMOUNT: 648.99, STATUS: 'PROCESSING', SHIPPING_ADDRESS: 'Plot 42, Hitec City Phase 2, Hyderabad, TS 500081', PAYMENT_METHOD: 'CREDIT_CARD', PAYMENT_STATUS: 'PAID' },
      { ORDER_ID: 106, CUSTOMER_ID: 5, ORDER_DATE: new Date(Date.now() - 1 * 86400000).toISOString(), TOTAL_AMOUNT: 258.00, STATUS: 'PENDING', SHIPPING_ADDRESS: '88 Innovation Way, Boston, MA 02110', PAYMENT_METHOD: 'DEBIT_CARD', PAYMENT_STATUS: 'PENDING' },
      { ORDER_ID: 107, CUSTOMER_ID: 1, ORDER_DATE: new Date(Date.now() - 2 * 3600000).toISOString(), TOTAL_AMOUNT: 488.99, STATUS: 'PENDING', SHIPPING_ADDRESS: '400 Oracle Parkway, Suite 1200, Redwood City, CA 94065', PAYMENT_METHOD: 'CREDIT_CARD', PAYMENT_STATUS: 'PENDING' }
    ],
    orderItems: [
      { ORDER_ITEM_ID: 1001, ORDER_ID: 101, PRODUCT_ID: 1, QUANTITY: 1, UNIT_PRICE: 2499.99, SUBTOTAL: 2499.99 },
      { ORDER_ITEM_ID: 1002, ORDER_ID: 101, PRODUCT_ID: 2, QUANTITY: 1, UNIT_PRICE: 799.00, SUBTOTAL: 799.00 },
      { ORDER_ITEM_ID: 1003, ORDER_ID: 102, PRODUCT_ID: 9, QUANTITY: 1, UNIT_PRICE: 89.99, SUBTOTAL: 89.99 },
      { ORDER_ITEM_ID: 1004, ORDER_ID: 102, PRODUCT_ID: 10, QUANTITY: 1, UNIT_PRICE: 74.50, SUBTOTAL: 74.50 },
      { ORDER_ITEM_ID: 1005, ORDER_ID: 103, PRODUCT_ID: 2, QUANTITY: 1, UNIT_PRICE: 799.50, SUBTOTAL: 799.50 },
      { ORDER_ITEM_ID: 1006, ORDER_ID: 103, PRODUCT_ID: 8, QUANTITY: 1, UNIT_PRICE: 420.00, SUBTOTAL: 420.00 },
      { ORDER_ITEM_ID: 1007, ORDER_ID: 104, PRODUCT_ID: 7, QUANTITY: 1, UNIT_PRICE: 580.00, SUBTOTAL: 580.00 },
      { ORDER_ITEM_ID: 1008, ORDER_ID: 104, PRODUCT_ID: 8, QUANTITY: 1, UNIT_PRICE: 420.00, SUBTOTAL: 420.00 },
      { ORDER_ITEM_ID: 1009, ORDER_ID: 105, PRODUCT_ID: 3, QUANTITY: 1, UNIT_PRICE: 299.00, SUBTOTAL: 299.00 },
      { ORDER_ITEM_ID: 1010, ORDER_ID: 105, PRODUCT_ID: 4, QUANTITY: 1, UNIT_PRICE: 349.99, SUBTOTAL: 349.99 },
      { ORDER_ITEM_ID: 1011, ORDER_ID: 106, PRODUCT_ID: 5, QUANTITY: 1, UNIT_PRICE: 159.00, SUBTOTAL: 159.00 },
      { ORDER_ITEM_ID: 1012, ORDER_ID: 106, PRODUCT_ID: 6, QUANTITY: 1, UNIT_PRICE: 99.00, SUBTOTAL: 99.00 },
      { ORDER_ITEM_ID: 1013, ORDER_ID: 107, PRODUCT_ID: 4, QUANTITY: 1, UNIT_PRICE: 349.99, SUBTOTAL: 349.99 },
      { ORDER_ITEM_ID: 1014, ORDER_ID: 107, PRODUCT_ID: 11, QUANTITY: 1, UNIT_PRICE: 139.00, SUBTOTAL: 139.00 }
    ],
    auditLogs: []
  };
}

async function executeQuery(sql, binds = [], options = {}) {
  if (isConnected && pool) {
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(sql, binds, {
        autoCommit: options.autoCommit ?? true,
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        ...options
      });
      return result;
    } catch (err) {
      console.error('[OracleDB Execute Error]:', err.message, 'SQL:', sql);
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeErr) {
          console.error('[OracleDB Connection Close Error]:', closeErr.message);
        }
      }
    }
  }

  // Fallback handler if Oracle is disconnected
  return handleFallbackQuery(sql, binds);
}

function handleFallbackQuery(sql, binds) {
  const normalized = sql.trim().toLowerCase();
  initFallbackData();

  if (normalized.includes('vw_customer_order_history') || (normalized.includes('customers') && normalized.includes('orders') && normalized.includes('order_items'))) {
    let rows = [];
    for (const c of memoryFallbackData.customers) {
      const custOrders = memoryFallbackData.orders.filter(o => o.CUSTOMER_ID === c.CUSTOMER_ID);
      for (const o of custOrders) {
        const items = memoryFallbackData.orderItems.filter(oi => oi.ORDER_ID === o.ORDER_ID);
        for (const oi of items) {
          const prod = memoryFallbackData.products.find(p => p.PRODUCT_ID === oi.PRODUCT_ID) || {};
          rows.push({
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
    return { rows };
  }

  if (normalized.startsWith('select') && normalized.includes('from categories')) {
    return { rows: [...memoryFallbackData.categories] };
  }

  if (normalized.startsWith('select') && normalized.includes('from products')) {
    return { rows: [...memoryFallbackData.products] };
  }

  if (normalized.startsWith('select') && normalized.includes('from customers')) {
    return { rows: [...memoryFallbackData.customers] };
  }

  if (normalized.startsWith('select') && normalized.includes('from orders')) {
    return { rows: [...memoryFallbackData.orders] };
  }

  return { rows: [] };
}

function getDatabaseStatus() {
  return {
    connected: isConnected,
    mode: isConnected ? 'ORACLE_21C_LIVE' : 'MEMORY_FALLBACK_ACTIVE',
    connectString: process.env.ORACLE_CONNECT_STRING || 'localhost:1521/XEPDB1',
    user: process.env.ORACLE_USER || 'ECOMMERCE_DBA',
    error: connectionError
  };
}

module.exports = {
  initOraclePool,
  executeQuery,
  getDatabaseStatus,
  getMemoryFallback: () => {
    if (!memoryFallbackData) initFallbackData();
    return memoryFallbackData;
  }
};
