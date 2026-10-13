# Project: perdomopro-ux-refactor

## Architecture
- **Framework & Runtime**: Astro 5 (Static Output) + Tailwind CSS + GSAP ScrollTrigger + Node v24 LTS.
- **Backend**: Azure Functions (`api/`) handling `/api/contact`.
- **Hosting / Infra**: Azure Static Web Apps (`public/staticwebapp.config.json`).
- **Core Modules**:
  - `src/scripts/motion.ts`: ScrollTrigger reveals, word morph, smooth scroll, reduced motion detection.
  - `src/styles/global.css`: Base design tokens, typography, CSS transition rules, animation classes.
  - `src/components/Hero.astro`: Entry point, typography morph, social links, status badge.
  - `src/components/ConsultingPage.astro`: Diagnostic consultation layout, friction badges, solutions grid, sequential stepper, contracting tiers, contact form.
  - `src/data/projects.ts` & `src/components/Projects.astro`: Technical project catalog, vector graphic previews, metadata, live links.
  - `src/pages/index.astro`: Main portfolio homepage with strict section sequence (Hero ➔ Experiencia ➔ Soluciones PyME ➔ Proyectos ➔ Sobre mí).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Scroll Blur & Opacity Elimination | Remove `filter: blur(...)` and `opacity` scrubbing in `exitCandidates` in `src/scripts/motion.ts` to prevent ClearType antialiasing shifts. | M1 | ORIGINAL_REQUEST §R1 |
| 2 | CSS / GSAP Collision Removal | Remove colliding `transition: filter` and `transition: opacity` in `global.css` (`.consulting-reveal`) and `transition-transform` in `Process.astro`. | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Hardware-Accelerated Reveals | Enforce GPU-accelerated reveals (`opacity`, `transform: translateY`) with `once: true` and clean inline properties upon completion. | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Prefers-Reduced-Motion Strictness | Ensure `prefers-reduced-motion: reduce` renders all content statically and visible immediately with 0 CSS transitions or GSAP scrubbing. | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Consultoria Problems Redesign | Diagnostic symptom and operational bottleneck cards using `bg-canvas-subtle`, amber alert micro-badges, and structured friction breakdown. | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Consultoria Solutions Redesign | High-value solution cards with crisp white surfaces, deliverable checklists ("Qué incluye"), PyME use cases, and balanced grid. | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Consultoria Connected Process Stepper | Sequentially connected visual stepper with progress track (horizontal desktop, vertical mobile) and numbered circular milestone nodes. | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Scope & Contracting Investment Models | Refactor Investment section into 3 transparent contracting tiers (Closed Sprint, Technical Advisory, Continuous Retainer) and cloud sovereignty notice. | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Contact Form Integration Preservation | Preserve `/api/contact` payload format, field names, honeypot, and accessible `aria-live="polite"` feedback in `ConsultingPage.astro`. | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Project Vector SVG Visual Assets | Author high-fidelity vector SVG previews for `gadgetStock` (Swagger UI), `etf-portfolio-analytics` (dashboard), and `adrian-quant-lab` (pipeline). | M3 | ORIGINAL_REQUEST §R3 |
| 11 | Projects Data & Preview Binding | Update `src/data/projects.ts` with `preview` properties and localized `alt` text for all 3 projects; eliminate `#0F0F14` terminal box fallback. | M3 | ORIGINAL_REQUEST §R3 |
| 12 | PyME Practical Demos in /consultoria | Incorporate `gadgetStock` as an interactive practical demonstration in `ConsultingPage.astro` with PyME tool badges. | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Main Page Section Ordering Preservation | Strictly preserve index.astro section ordering: Hero (01) ➔ Experiencia (02) ➔ Soluciones PyME (03) ➔ Proyectos (04) ➔ Sobre mí (05). | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Hero Typography Contrast WCAG AA | Adjust `[data-word-morph]` in `Hero.astro` to ensure $\ge 3:1$ contrast (and $\ge 4.5:1$ floor) during word rotation transitions against canvas. | M4 | ORIGINAL_REQUEST §R4 |
| 15 | E2E Test Suite & Test Runner | Automated opaque-box test runner validating Tiers 1-4 (Features, Boundaries, Interactions, Scenarios) and publishing `TEST_READY.md`. | Test Track | Dual Track |
| 16 | Final Quality, Build & Lighthouse Gating | Pass 100% E2E tests, 0 errors in `npx astro check` and `npm run build`, Lighthouse 100/100, and Tier 5 adversarial verification. | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| Test Track | E2E Test Suite Creation | Test runner & Tiers 1-4 test suite derived from ORIGINAL_REQUEST.md; publish TEST_READY.md | none | DONE |
| M1 | Motion Stabilization & Flickering Elimination | `src/scripts/motion.ts`, `src/styles/global.css`, `src/components/Process.astro` | none | DONE |
| M2 | Consultoria Visual Restructuring | `src/components/ConsultingPage.astro`, `src/styles/global.css` | M1 | IN_PROGRESS |
| M3 | Project Graphic Enrichment & Section Order | `public/images/projects/*`, `src/data/projects.ts`, `src/components/Projects.astro`, `src/components/ConsultingPage.astro`, `src/pages/index.astro` | none | PLANNED |
| M4 | Hero Contrast & WCAG AA Accessibility | `src/components/Hero.astro` | none | PLANNED |
| M5 | Final E2E Test Pass & Adversarial Hardening | Full test run (Tiers 1-4), Tier 5 adversarial stress testing, Lighthouse audit, build verification | M1, M2, M3, M4, Test Track | PLANNED |

## Interface Contracts
### `motion.ts` ↔ DOM Elements
- Elements expecting scroll reveals must supply `data-scroll-module` on parent container and `data-reveal-item` on individual cards/items.
- Entrance animations use GSAP `fromTo` with accelerated props (`opacity`, `transform: translateY`) and `once: true`.
- No element shall have inline `filter` or `opacity` scrubbed on scroll exit.

### `ConsultingPage.astro` ↔ `/api/contact`
- Form submission sends `POST /api/contact` with Content-Type `application/json`.
- Payload schema: `{ nombre: string, correo: string, negocio?: string, telefono?: string, preferencia?: string, descripcion: string, servicio: string, sitioWeb?: string, idioma: 'es' | 'en' }`.
- Status region: `#consulting-form-status` with `role="status"` and `aria-live="polite"`.

### `src/data/projects.ts` ↔ `Projects.astro`
- Each project in `projectsData` must supply:
  ```typescript
  preview: {
    src: string; // Absolute path from public root, e.g. '/images/projects/gadgetstock-swagger.svg'
    alt: Record<Locale, string>;
  }
  ```
- Ratio: `aspect-[16/8]` or `aspect-[16/9]` with lazy loading and decoding async.

### `Hero.astro` ↔ Accessibility
- `[data-word-morph]` text element:
  - Transition duration: 300ms.
  - Opacity floor during transitions: $\ge 0.60$ (contrast ratio $\ge 4.65:1$ against `#FFFFFF`).
  - Screen reader accessibility: `aria-hidden="true"` on animated morph span with static parent accessible announcement or appropriate label.

## Code Layout
```
perdomopro/
├── public/
│   ├── images/projects/               # Project graphic assets (SVG, WebP, JPG)
│   └── staticwebapp.config.json       # MIME types & routing config
├── src/
│   ├── components/
│   │   ├── ConsultingPage.astro       # Consultoria main page component
│   │   ├── Hero.astro                 # Hero section & word-morph
│   │   ├── Navbar.astro               # Top navigation
│   │   ├── Process.astro              # Process section
│   │   └── Projects.astro             # Projects showcase component
│   ├── data/
│   │   └── projects.ts                # Projects dataset & type definitions
│   ├── pages/
│   │   ├── index.astro                # Home (es-MX)
│   │   ├── consultoria/index.astro    # Consulting (es-MX)
│   │   └── en/                        # English localized pages
│   ├── scripts/
│   │   └── motion.ts                  # GSAP & ScrollTrigger motion engine
│   └── styles/
│       └── global.css                 # Global CSS & reveal utility classes
├── tests/                             # E2E test suite & fixtures
└── api/                               # Azure Functions backend
```
