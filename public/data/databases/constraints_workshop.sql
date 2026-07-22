PRAGMA foreign_keys = ON;

-- Constraint workshop database for Module 12

CREATE TABLE teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO teams (id, name) VALUES
  (1, 'Engineering'),
  (2, 'Support');

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'member',
  age INTEGER CHECK (age >= 18),
  team_id INTEGER,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

INSERT INTO users (username, email, role, age, team_id) VALUES
  ('alice', 'alice@example.com', 'admin', 31, 1),
  ('ben', 'ben@example.com', 'member', 24, 2);

CREATE TABLE courses (
  department TEXT,
  course_number INTEGER,
  title TEXT,
  PRIMARY KEY (department, course_number)
);

INSERT INTO courses (department, course_number, title) VALUES
  ('ENG', 101, 'Intro to SQL'),
  ('SUP', 210, 'Support Writing');

CREATE TABLE course_sessions (
  department TEXT,
  course_number INTEGER,
  term TEXT,
  room TEXT,
  PRIMARY KEY (department, course_number, term),
  FOREIGN KEY (department, course_number) REFERENCES courses(department, course_number)
);

INSERT INTO course_sessions (department, course_number, term, room) VALUES
  ('ENG', 101, 'Fall', 'Room A'),
  ('SUP', 210, 'Winter', 'Room B');
