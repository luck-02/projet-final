CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  price NUMERIC(10,2),
  stock INT
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id),
  quantity INT,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO products (name, price, stock) VALUES
  ('MacBook Pro', 2499.99, 10),
  ('iPhone 15', 999.99, 50),
  ('AirPods Pro', 279.99, 100),
  ('iPad Air', 749.99, 30),
  ('Apple Watch', 499.99, 25)
ON CONFLICT DO NOTHING;
