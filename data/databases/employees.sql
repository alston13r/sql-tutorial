-- Seed database for early tutorial exercises
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary REAL,
  hired_date TEXT
);

INSERT INTO employees (id, name, department, salary, hired_date) VALUES
  (1, 'Alice Chen', 'Engineering', 95000, '2021-03-15'),
  (2, 'Bob Martinez', 'Engineering', 88000, '2020-07-01'),
  (3, 'Carol Williams', 'Marketing', 72000, '2022-01-10'),
  (4, 'David Kim', 'Sales', 65000, '2023-06-20'),
  (5, 'Eve Johnson', 'Sales', 68000, '2021-11-05'),
  (6, 'Frank Lee', 'HR', NULL, '2019-09-12');

CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  budget REAL
);

INSERT INTO departments (id, name, budget) VALUES
  (1, 'Engineering', 500000),
  (2, 'Marketing', 200000),
  (3, 'Sales', 300000),
  (4, 'HR', 150000);
