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
- `public/data/` for lesson and exercise metadata
- `js/` for rendering, auth, and exercise logic
- `css/` for site styling

## Purpose

This project is intended primarily as a personal learning tool, while also adding a small sense of progression and gamification to learning SQL.

## Local Development

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

Then open:

[http://localhost:5173/sql-tutorial/](http://localhost:5173/sql-tutorial/)

Production build and local preview:

```bash
npm run build
npm run preview
```

## Deployment

Pushes to `main` deploy automatically via GitHub Actions (`.github/workflows/deploy.yml`).

One-time setup in the GitHub repo:

1. Go to **Settings → Pages**
2. Set **Build and deployment → Source** to **GitHub Actions**

Manual deploy alternative:

```bash
npm run build
npx gh-pages -d dist
```

Then set Pages to deploy from the `gh-pages` branch.
