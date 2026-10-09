# Test Infrastructure & Methodology (`TEST_INFRA.md`)

## 1. Overview
This document specifies the architecture, methodology, validation thresholds, and execution commands for the automated opaque-box End-to-End (E2E) test suite of `perdomopro.com` and `perdomopro.com/consultoria`.

The test suite acts as an authoritative oracle derived directly from `ORIGINAL_REQUEST.md` and `PROJECT.md`. It validates both compiled build artifacts (`dist/`) and component/style contracts (`src/`) against strict UX, motion stability, visual hierarchy, and WCAG AA accessibility requirements.

---

## 2. 4-Tier Testing Methodology Architecture

The test suite is structured into four progressive tiers:

```
tests/
├── helpers/
│   ├── contrast.js                    # WCAG 2.1 photometric luminance & contrast math
│   ├── dom.js                         # parse5 HTML AST traversal & DOM queries
│   └── fixtures.js                    # File loaders & path constants
├── tier1-features/                    # Tier 1: Feature Coverage (>=5 tests per area)
│   ├── build-quality.test.js          # Build, Azure SWA config, sitemap, routing (5 tests)
│   ├── consultoria-blocks.test.js     # Frictions, solutions, stepper, scope, form (6 tests)
│   ├── hero-contrast.test.js          # Morph contrast, timing, WCAG AA, a11y (6 tests)
│   ├── motion-flickering.test.js      # Blur elimination, collision, GPU transforms (7 tests)
│   └── projects-catalog.test.js       # Vector graphics, no #0F0F14, section order (6 tests)
├── tier2-boundaries/                  # Tier 2: Boundary & Corner Cases (>=5 tests per area)
│   ├── consultoria-boundaries.test.js # Trimming, 16KB payload limits, unicode, honeypot (5 tests)
│   ├── hero-contrast-boundaries.test.js# Subtle canvas contrast, alpha scan, timings (5 tests)
│   ├── motion-boundaries.test.js      # Responsive breakpoints, containment, null guards (5 tests)
│   └── projects-boundaries.test.js    # Link security, numbering sequences, tech stacks (5 tests)
├── tier3-interactions/                # Tier 3: Pairwise Cross-Feature Interactions
│   └── cross-feature-interactions.test.js # Smooth scroll + CLS, reduced motion + wash, etc. (6 tests)
├── tier4-scenarios/                   # Tier 4: Real-World Application Scenarios
│   └── user-journeys.test.js          # End-to-end user journeys (PyME owner, recruiter, a11y) (4 tests)
└── run-all.js                         # Cross-platform runner script with per-suite reporting
```

### Tier Definitions
- **Tier 1: Feature Coverage**: Verifies primary functional requirements, component contracts, and UI states.
- **Tier 2: Boundary & Corner Cases**: Exercises extreme input lengths, viewport boundaries, lifecycle stress, and null tolerance.
- **Tier 3: Pairwise Cross-Feature Interactions**: Validates the co-existence of disparate systems (e.g., Lenis ticker + aspect ratio CLS prevention, prefers-reduced-motion toggling during active CSS/GSAP tweens).
- **Tier 4: Real-World Application Scenarios**: Simulates end-to-end multi-step user workflows (PyME business owner conversion, technical recruiter review, low-vision a11y reader, intermittent network failure).

---

## 3. Thresholds & Specifications Matrix

| Feature Domain | Test Metric / Target | Authoritative Threshold | Governing Rule |
| :--- | :--- | :--- | :--- |
| **Motion Stability** | Scroll text exit blur | 0 instances of `filter: blur(...)` in `exitCandidates` | ORIGINAL_REQUEST §R1 |
| **CSS / GSAP Collisions** | Competing CSS transitions | 0 `transition: filter` or `transition: opacity` in `.consulting-reveal`, 0 `transition-transform` on `[data-process-progress]` | PROJECT.md #2 |
| **Accessibility Motion** | `prefers-reduced-motion: reduce` | `transition-duration: 0.01ms !important`, 0 GSAP scrub, immediate visibility | ORIGINAL_REQUEST §R1 |
| **Hero Contrast** | Morph transition contrast ratio | $\ge 3:1$ minimum at all frames; $\ge 4.5:1$ at resting states | ORIGINAL_REQUEST §R4 |
| **Hero Opacity Floor** | Transition minimum opacity | $\ge 0.60$ floor ($\approx 4.65:1$ contrast against `#FFFFFF`) | PROJECT.md Interface Contracts |
| **Hero Text Size** | Headline scale | $\ge 24\text{px}$ (large text classification under WCAG 2.1) | WCAG 2.1 Guideline 1.4.3 |
| **Section Ordering** | `index.astro` sequence | Strict sequence: Hero (01) $\to$ Experiencia (02) $\to$ Soluciones PyME (03) $\to$ Proyectos (04) $\to$ Sobre mí (05) | ORIGINAL_REQUEST §R3 |
| **Project Previews** | Visual assets | 100% of projects provide `preview: { src, alt }`; 0 instances of `#0F0F14` terminal box fallback | ORIGINAL_REQUEST §R3 |
| **Contact Form** | Honeypot & status | Honeypot parameter `sitioWeb`, `#consulting-form-status` with `role="status"` and `aria-live="polite"` | PROJECT.md Interface Contracts |

---

## 4. Test Execution Commands

### Full Suite Execution
Run all 60 tests across Tiers 1–4 using the standardized runner:
```bash
npm test
```
Or directly via Node.js:
```bash
node tests/run-all.js
```

### Granular Execution by Tier / Suite
Execute individual test files directly with Node.js built-in runner:
```bash
# Tier 1 Suites
node --test tests/tier1-features/motion-flickering.test.js
node --test tests/tier1-features/consultoria-blocks.test.js
node --test tests/tier1-features/projects-catalog.test.js
node --test tests/tier1-features/hero-contrast.test.js
node --test tests/tier1-features/build-quality.test.js

# Tier 2 Suites
node --test tests/tier2-boundaries/motion-boundaries.test.js
node --test tests/tier2-boundaries/consultoria-boundaries.test.js
node --test tests/tier2-boundaries/projects-boundaries.test.js
node --test tests/tier2-boundaries/hero-contrast-boundaries.test.js

# Tier 3 Suite
node --test tests/tier3-interactions/cross-feature-interactions.test.js

# Tier 4 Suite
node --test tests/tier4-scenarios/user-journeys.test.js
```

### Build & Quality Verification
```bash
npm run check    # Astro static type checking
npm run build    # Static site production build
```
