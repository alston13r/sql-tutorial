-- Employees database for Module 7 JOIN exercises
-- employees.department_id links to departments.id; manager_id is a self-reference

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
  (8, 'Operations', 175000),
  (9, 'Research', 120000);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER NOT NULL,
  job_title TEXT NOT NULL,
  salary REAL,
  hired_date TEXT,
  manager_id INTEGER
);

INSERT INTO employees (id, name, department_id, job_title, salary, hired_date, manager_id) VALUES
  (1, 'Alice Chen', 1, 'Software Engineer', 95000, '2021-03-15', NULL),
  (2, 'Bob Martinez', 1, 'Software Engineer', 88000, '2020-07-01', 1),
  (3, 'Carol Williams', 2, 'Marketing Manager', 72000, '2022-01-10', NULL),
  (4, 'David Kim', 3, 'Account Executive', 65000, '2023-06-20', NULL),
  (5, 'Eve Johnson', 3, 'Account Executive', 68000, '2021-11-05', 4),
  (6, 'Frank Lee', 4, 'HR Specialist', NULL, '2019-09-12', NULL),
  (7, 'Grace Patel', 5, 'Financial Analyst', 74000, '2020-04-22', NULL),
  (8, 'Henry Brown', 5, 'Accountant', 69000, '2018-12-03', 7),
  (9, 'Iris Nguyen', 6, 'Support Specialist', 58000, '2022-08-14', NULL),
  (10, 'Jack Wilson', 6, 'Support Specialist', 56000, '2023-02-28', 9),
  (11, 'Kara Davis', 7, 'Counsel', 105000, '2017-05-09', NULL),
  (12, 'Liam O''Brien', 8, 'Operations Manager', 82000, '2019-01-17', NULL),
  (13, 'Mia Santos', 1, 'DevOps Engineer', 91000, '2021-10-30', 1),
  (14, 'Noah Taylor', 2, 'Content Writer', 64000, '2023-04-11', 3);
