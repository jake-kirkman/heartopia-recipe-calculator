# Heartopia Recipe Calculator

> **Disclaimer:** This project was vibe coded almost entirely using [Claude Code](https://claude.com/claude-code). The code, architecture, and styling decisions were generated through AI-assisted development and are **not representative** of what I would typically write by hand. It was a fun experiment in seeing how far you can push AI-driven development for a small community tool.

**This project is fully open source.** You are welcome to fork, modify, update, or contribute in any way you like. If you spot incorrect game data, want to add missing recipes, or have ideas for new features, feel free to open an issue or submit a pull request.

## What is this?

A fan-made recipe calculator and batch cooking planner for Heartopia. It helps players:

- **Browse recipes** with search, filters, and detailed ingredient breakdowns
- **Compare profit** across all recipes and star ratings with a sortable table
- **Plan batch cooking sessions** with aggregated ingredient lists, shopping lists, and farming schedules
- **Track inventory** to see what you already have and what you still need
- **View ingredient sources** (shop, foraged, farmed, fished, special)

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS 3.4
- react-router-dom (HashRouter for GitHub Pages)
- No backend -- all game data is hardcoded in TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Deployment

The app is deployed to GitHub Pages via GitHub Actions. Pushes to `main` trigger an automatic build and deploy.

## Contributing

Contributions are welcome! Some areas where help would be appreciated:

- **Game data** -- recipes, ingredients, and prices are crowd-sourced and may be incomplete or incorrect (especially levels 10-13)
- **Features** -- any quality-of-life improvements for Heartopia players
- **Bug fixes** -- if something looks off, please open an issue

## License

This is an open source fan project. Not affiliated with or endorsed by the Heartopia developers.
