# Wuxia Wednesday — Agent Guide

## What This Project Is

A single-page **movie graph explorer** PWA. The user starts from the most popular movie on [TMDb](https://www.themoviedb.org/) (or searches for any film), then clicks movie posters or actor nodes to expand the graph and discover new connections through shared cast members.

The name comes from a weekly movie-night game where the goal is to watch films connected to each other through shared cast.

Live site: <https://wuxia-wednesday.netlify.app/>

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 3](https://nuxt.com/) (Vue 3, SSG/SPA) |
| Graph rendering | [Cytoscape.js](https://js.cytoscape.org/) + [fCoSE](https://github.com/iVis-at-Bilkent/cytoscape.js-fcose) layout + [cxtmenu](https://github.com/cytoscape/cytoscape.js-cxtmenu) |
| UI components | [Oruga](https://oruga.io/) + [Bulma](https://bulma.io/) theme |
| Data source | [TMDb API](https://developer.themoviedb.org/docs) |
| Hosting | [Netlify](https://www.netlify.com/) |
| PWA | Workbox-based service worker |
| Styling | SCSS |
| Language | TypeScript / JavaScript |

## Project Structure

```
components/   # Vue components (graph, modals, logo, debugger, etc.)
plugins/      # Nuxt plugins
public/       # Static assets (favicons, PWA icons)
```

Key files in the root: the root app component, the Nuxt config (which also defines PWA settings and TMDb API caching rules), and a Cytoscape stylesheet that controls node/edge appearance.

## Key Concepts

- **Nodes** are either movies (`movie:<tmdb-id>`) or people (`person:<tmdb-id>`).  
- **Edges** connect a movie to each cast member that appears in both nodes' credit lists.  
- Clicking a node fetches its TMDb details and adds the next page of connected nodes (sorted by popularity).  
- **Auto Mode** iterates over every person node in the graph, fully expanding each one until no new nodes appear.  
- Graph state (all Cytoscape element JSON) is serialised into `history.pushState` so the browser back/forward buttons work.

## Common Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server at http://localhost:3000
npm run lint      # ESLint (TypeScript + Vue)
npm run build     # production build
npm run preview   # preview production build locally
```

## Notes for Agents

- There is no backend; all data comes from the public TMDb API using a hardcoded read-only API key.
- There are no automated tests in this repository yet.
- The Oruga component library uses a customised dark colour theme defined in the root component's `<style>` block.
- The Cytoscape stylesheet is hot-reloaded in dev mode via Vite's HMR.
