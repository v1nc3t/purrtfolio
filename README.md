# purrtfolio

A terminal-themed personal website that consolidates my CV, code projects, photography, and categorized how-to guides in one place.

On first visit you enter a name that becomes your terminal username. Typing commands like `about`, `projects`, or `photos` opens floating windows next to the terminal. Each window behaves like a window manager: switch focus between them, close them, and only one window per command type stays open at a time. A dedicated key zooms out to an overview of all open windows so you can pick which to focus.

Photos are served from a separate private service rather than stored in this repo.

This README is a development snapshot. Features above are the target, not all implemented yet.

## Stack

- [Vite](https://vite.dev/)
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) v4 (`@tailwindcss/vite`, theme tokens in `src/index.css`)

## Scripts

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Notes

- Window manager, commands, and photo fetching are still to be built.
- Do not commit photography assets; they live on the private photo service.
