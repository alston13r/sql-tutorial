-- Byte Brew cafe seed for the practice desk game
CREATE TABLE drinks (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL
);

INSERT INTO drinks (id, name, category, price) VALUES
  (1, 'Espresso', 'espresso', 2.50),
  (2, 'Americano', 'espresso', 3.00),
  (3, 'Latte', 'espresso', 4.25),
  (4, 'Cappuccino', 'espresso', 4.00),
  (5, 'Cold Brew', 'espresso', 3.50),
  (6, 'Matcha Latte', 'tea', 4.50),
  (7, 'Chai Latte', 'tea', 4.00),
  (8, 'Green Tea', 'tea', 2.75),
  (9, 'Hot Chocolate', 'other', 3.75),
  (10, 'Pumpkin Spice', 'seasonal', 5.00);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO customers (id, name) VALUES
  (1, 'Maya Chen'),
  (2, 'Jordan Lee'),
  (3, 'Sam Okonkwo'),
  (4, 'Riley Park');

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  drink_id INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  ordered_at TEXT NOT NULL
);

INSERT INTO orders (id, customer_id, drink_id, qty, ordered_at) VALUES
  (1, 1, 3, 2, '2026-07-01'),
  (2, 1, 5, 1, '2026-07-02'),
  (3, 2, 1, 1, '2026-07-01'),
  (4, 2, 6, 1, '2026-07-03'),
  (5, 3, 4, 3, '2026-07-02'),
  (6, 3, 7, 1, '2026-07-04'),
  (7, 4, 2, 2, '2026-07-03'),
  (8, 4, 10, 1, '2026-07-05'),
  (9, 1, 8, 1, '2026-07-05'),
  (10, 2, 3, 1, '2026-07-06');
