-- Security login demo for Module 14 (intentionally plain-text passwords for teaching)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

INSERT INTO users (id, username, password) VALUES
  (1, 'admin', 's3cret-admin-pass'),
  (2, 'ben', 'benpass'),
  (3, 'cara', 'carapass'),
  (4, 'dana', 'danapass');
