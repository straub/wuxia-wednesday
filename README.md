# Wuxia Wednesday

A movie graph explorer that lets you navigate between films connected by their shared cast members. Start from the most popular movie on [TMDb](https://www.themoviedb.org/) (or search for any movie), then click actors or movies to expand the graph and discover new connections.

The name comes from a weekly movie-night game where the goal is to watch movies that are connected to each other through shared cast — this site helps with that.

## Tech Stack

- [Nuxt 3](https://nuxt.com/) (Vue 3)
- [Cytoscape.js](https://js.cytoscape.org/) with the [fCoSE](https://github.com/iVis-at-Bilkent/cytoscape.js-fcose) layout
- [Oruga](https://oruga.io/) UI component library
- [TMDb API](https://developer.themoviedb.org/docs) for movie and person data
- [Netlify](https://www.netlify.com/) hosting with PWA support via `@vite-pwa/nuxt`

## Setup

Install dependencies:

```bash
npm install
```

## Development

Start the development server on <http://localhost:3000>:

```bash
npm run dev
```

## Lint

```bash
npm run lint
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview the production build:

```bash
npm run preview
```
