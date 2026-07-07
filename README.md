# SQLite Tutorial

A small web-based SQLite learning project built to make SQL practice more interactive and a bit more game-like.

The goal of this repo is to provide:

- a guided set of SQL learning modules
- hands-on exercises using SQLite in the browser
- a simple progress experience for tracking completed work
- a lightweight static site that can be hosted on GitHub Pages

## Live Site

Open the tutorial here:

[https://alston13r.github.io/sql-tutorial/](https://alston13r.github.io/sql-tutorial/)

## What This Repo Contains

- `index.html` and `index-path.html` for the main module views
- `modules/` for lesson pages
- `data/` for lesson and exercise metadata
- `js/` for rendering, auth, and exercise logic
- `css/` for site styling

## Purpose

This project is intended primarily as a personal learning tool, while also adding a small sense of progression and gamification to learning SQL.

## Local Development

Run the local server with:

```bash
python serve.py 8765
```

Then open:

[http://localhost:8765](http://localhost:8765)

