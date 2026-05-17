const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const log = (level, message) =>
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message }));

const FALLBACK_PRODUCTS = [
  { id: 1, name: 'MacBook Pro', price: '2499.99', stock: 10 },
  { id: 2, name: 'iPhone 15', price: '999.99', stock: 50 },
  { id: 3, name: 'AirPods Pro', price: '279.99', stock: 100 },
  { id: 4, name: 'iPad Air', price: '749.99', stock: 30 },
  { id: 5, name: 'Apple Watch', price: '499.99', stock: 25 },
];

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

app.get('/products', async (req, res) => {
  const result = await query('SELECT * FROM products ORDER BY id');
  if (result) {
    log('info', `GET /products — ${result.rows.length} rows from db`);
    return res.json(result.rows);
  }
  log('warn', 'GET /products — using fallback data');
  res.json(FALLBACK_PRODUCTS);
});

app.get('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await query('SELECT * FROM products WHERE id=$1', [id]);
  if (result) {
    if (result.rows.length === 0) return res.status(404).json({ error: 'not found' });
    log('info', `GET /products/${id} — found`);
    return res.json(result.rows[0]);
  }
  const product = FALLBACK_PRODUCTS.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'not found' });
  log('warn', `GET /products/${id} — using fallback data`);
  res.json(product);
});

const port = process.env.PORT || 3000;
app.listen(port, () => log('info', `catalogue listening on ${port}`));
