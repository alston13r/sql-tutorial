-- Moving-data workshop for Module 15 INSERT INTO SELECT exercises

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
  (4, 3, 'Add login troubleshooting guide', 'In Progress'),
  (5, 2, 'Finalize Q4 slides', 'Done'),
  (6, 1, 'Fix navigation bug', 'In Progress');

CREATE TABLE tasks_archive (
  id INTEGER PRIMARY KEY,
  project_id INTEGER,
  title TEXT,
  archived_on TEXT
);
