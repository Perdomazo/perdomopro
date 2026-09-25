# PerdomoPro — Technical Architecture Foundation (Phase 1)

Personal technology brand belonging to Adrián Perdomo (Guadalajara, Jalisco, México).

Focus direction: **Software + Infrastructure + Cloud + Automation + AI**.

---

## Architectural Highlights

- **Framework**: Astro 5 (Static HTML output target)
- **Language**: TypeScript (strict configuration)
- **Styling**: Tailwind CSS 4 (Vite-first `@tailwindcss/vite` integration)
- **Internationalization (i18n)**:
  - Default primary language: **Spanish** (`es-MX`) served at `/`
  - Secondary language: **English** (`en`) served at `/en/`
  - Shared component architecture with localized content and typed dictionary
  - Localized canonical tags and `hreflang` alternate links
- **Design Tokens**: Centralized monochrome palette with warm off-white canvas (`#FAFAF8`), dark charcoal typography (`#111111`), and subtle borders (`#E7E7E5`) via CSS tokens and Tailwind theme.
- **Deployment**: Configured for Azure Static Web Apps (`public/staticwebapp.config.json`) and GitHub Actions.
- **Build Output**: Generates pure static HTML in `dist/`.

---

## Project Structure

```
perdomopro/
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml
├── public/
│   ├── favicon.svg
│   ├── og-image.png
│   ├── robots.txt
│   └── staticwebapp.config.json
├── src/
│   ├── components/
│   │   └── FoundationPlaceholder.astro
│   ├── config/
│   │   └── site.ts
│   ├── content/
│   │   └── projects/
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── ui.ts
│   │   └── utils.ts
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   └── en/
│   │       └── index.astro
│   └── styles/
│       └── global.css
├── astro.config.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## Commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript type check
npm run check

# Build static production bundle (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```
