-- Schema workshop database for Module 11 CREATE / ALTER / DROP exercises

CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT,
  owner TEXT
);

INSERT INTO projects (id, name, owner) VALUES
  (1, 'Website Refresh', 'Alice Chen'),
  (2, 'Quarterly Report', 'Grace Patel'),
  (3, 'Support Portal', 'Iris Nguyen');

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  project_id INTEGER,
  title TEXT,
  status TEXT
);

INSERT INTO tasks (id, project_id, title, status) VALUES
  (1, 1, 'Update homepage layout', 'In Progress'),
  (2, 1, 'Rewrite onboarding copy', 'Planned'),
  (3, 2, 'Collect finance numbers', 'Done'),
  (4, 3, 'Add login troubleshooting guide', 'In Progress');

CREATE TABLE tasks_archive (
  id INTEGER PRIMARY KEY,
  project_id INTEGER,
  title TEXT,
  archived_on TEXT
);

INSERT INTO tasks_archive (id, project_id, title, archived_on) VALUES
  (1, 1, 'Retire old landing page', '2024-10-01'),
  (2, 2, 'Archive Q3 drafts', '2024-10-15');
