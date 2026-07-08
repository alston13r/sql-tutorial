-- Employees database for Module 4 UPDATE / DELETE / NULL exercises
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  salary REAL,
  hired_date TEXT
);

INSERT INTO employees (id, name, department, job_title, salary, hired_date) VALUES
  (1, 'Alice Chen', 'Engineering', 'Software Engineer', 95000, '2021-03-15'),
  (2, 'Bob Martinez', 'Engineering', 'Software Engineer', 88000, '2020-07-01'),
  (3, 'Carol Williams', 'Marketing', 'Marketing Manager', 72000, '2022-01-10'),
  (4, 'David Kim', 'Sales', 'Account Executive', 65000, '2023-06-20'),
  (5, 'Eve Johnson', 'Sales', 'Account Executive', 68000, '2021-11-05'),
  (6, 'Frank Lee', 'HR', 'HR Specialist', NULL, '2019-09-12'),
  (7, 'Grace Patel', 'Finance', 'Financial Analyst', 74000, '2020-04-22'),
  (8, 'Henry Brown', 'Finance', 'Accountant', 69000, '2018-12-03'),
  (9, 'Iris Nguyen', 'Support', 'Support Specialist', 58000, '2022-08-14'),
  (10, 'Jack Wilson', 'Support', 'Support Specialist', 56000, '2023-02-28'),
  (11, 'Kara Davis', 'Legal', 'Counsel', 105000, '2017-05-09'),
  (12, 'Liam O''Brien', 'Operations', 'Operations Manager', 82000, '2019-01-17'),
  (13, 'Mia Santos', 'Engineering', 'DevOps Engineer', 91000, '2021-10-30'),
  (14, 'Noah Taylor', 'Marketing', 'Content Writer', 64000, '2023-04-11');

CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  budget REAL
);

INSERT INTO departments (id, name, budget) VALUES
  (1, 'Engineering', 500000),
  (2, 'Marketing', 200000),
  (3, 'Sales', 300000),
  (4, 'HR', 150000),
  (5, 'Finance', 250000),
  (6, 'Support', 180000),
  (7, 'Legal', 220000),
  (8, 'Operations', 175000);
