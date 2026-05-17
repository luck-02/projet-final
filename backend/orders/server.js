const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const log = (level, message) =>
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message }));

const FALLBACK_ORDERS = [];

let pool = null;

if (process.env.DB_HOST) {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 3000,
  });
  pool.on('error', (err) => log('error', `pg pool error: ${err.message}`));
}

async function query(sql, params) {
  if (!pool) return null;
  try {
    return await pool.query(sql, params);
  } catch (err) {
    log('warn', `db query failed: ${err.message}`);
    return null;
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/orders', async (req, res) => {
  const result = await query(
    'SELECT o.*, p.name FROM orders o JOIN products p ON p.id = o.product_id ORDER BY o.created_at DESC'
  );
  if (result) {
    log('info', `GET /orders — ${result.rows.length} rows from db`);
    return res.json(result.rows);
  }
  log('warn', 'GET /orders — using fallback data');
  res.json(FALLBACK_ORDERS);
});

app.post('/orders', async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'productId and quantity (>=1) are required' });
  }

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const stock = await client.query('SELECT stock FROM products WHERE id=$1 FOR UPDATE', [productId]);
      if (stock.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'product not found' });
      }
      if (stock.rows[0].stock < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'stock insuffisant' });
      }

      await client.query('UPDATE products SET stock = stock - $1 WHERE id=$2', [quantity, productId]);
      const result = await client.query(
        'INSERT INTO orders (product_id, quantity) VALUES ($1, $2) RETURNING *',
        [productId, quantity]
      );
      await client.query('COMMIT');

      log('info', `POST /orders — created order id=${result.rows[0].id}`);
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      log('error', `POST /orders transaction failed: ${err.message}`);
      return res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }

  const order = { id: Date.now(), product_id: productId, quantity, created_at: new Date() };
  FALLBACK_ORDERS.unshift(order);
  log('warn', 'POST /orders — stored in memory fallback');
  res.status(201).json(order);
});

const port = process.env.PORT || 3001;
app.listen(port, () => log('info', `orders listening on ${port}`));
