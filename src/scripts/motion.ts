import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register GSAP plugins once
gsap.registerPlugin(ScrollTrigger);

// Module-level references for cleanup and idempotence
let lenisInstance: Lenis | null = null;
let gsapMatchMediaInstance: gsap.MatchMedia | null = null;
let tickerListener: ((time: number) => void) | null = null;
let clickListener: ((e: MouseEvent) => void) | null = null;
let consultingRevealObserver: IntersectionObserver | null = null;
let washContext: gsap.Context | null = null;
let washLayer: HTMLElement | null = null;

// ----------------------------------------------------
// CORNER WASH
// Four radial lights, one per viewport corner. Each scroll "stage" lights a
// different combination of corners, so the glow never travels across the
// content: lights fade/scale in and out where they live, and drift a little
// (translate + rotate) as the page scrolls.
// ----------------------------------------------------
type WashCorner = 'tl' | 'tr' | 'bl' | 'br';

interface WashLight {
  /** Opacity of the corner light (0 = off) */
  o: number;
  /** Scale of the corner light */
  s: number;
  /** How far the light is pulled into the screen, in % of its own size */
  inset: number;
}

type WashPattern = Record<WashCorner, WashLight>;

const WASH_OUT = 40; // % of its size a light sits outside the viewport edge
const WASH_ORDER: WashCorner[] = ['tl', 'tr', 'bl', 'br'];

const WASH_CORNERS: Record<
  WashCorner,
  {
    sx: number;
    sy: number;
    pos: string;
    gradient: string;
    drift: { xPercent: number; yPercent: number; rotate: number }[];
  }
> = {
  tl: {
    sx: -1,
    sy: -1,
    pos: 'top:0;left:0;',
    gradient:
      'radial-gradient(ellipse at center, rgb(91 62 131 / 21%) 0%, rgb(115 87 155 / 11%) 32%, transparent 70%)',
    drift: [
      { xPercent: 12, yPercent: 9, rotate: 26 },
      { xPercent: -4, yPercent: 16, rotate: -12 },
      { xPercent: 10, yPercent: -3, rotate: 30 },
    ],
  },
  tr: {
    sx: 1,
    sy: -1,
    pos: 'top:0;right:0;',
    gradient:
      'radial-gradient(ellipse at center, rgb(115 87 155 / 19%) 0%, rgb(173 154 198 / 11%) 32%, transparent 70%)',
    drift: [
      { xPercent: -10, yPercent: 12, rotate: -24 },
      { xPercent: 6, yPercent: 4, rotate: 14 },
      { xPercent: -12, yPercent: 14, rotate: -32 },
    ],
  },
  bl: {
    sx: -1,
    sy: 1,
    pos: 'bottom:0;left:0;',
    gradient:
      'radial-gradient(ellipse at center, rgb(91 62 131 / 17%) 0%, rgb(173 154 198 / 10%) 32%, transparent 70%)',
    drift: [
      { xPercent: 10, yPercent: -10, rotate: -28 },
      { xPercent: 14, yPercent: 2, rotate: 10 },
      { xPercent: 4, yPercent: -14, rotate: -34 },
    ],
  },
  br: {
    sx: 1,
    sy: 1,
    pos: 'bottom:0;right:0;',
    gradient:
      'radial-gradient(ellipse at center, rgb(115 87 155 / 20%) 0%, rgb(91 62 131 / 10%) 32%, transparent 70%)',
    drift: [
      { xPercent: -12, yPercent: -8, rotate: 24 },
      { xPercent: -2, yPercent: -16, rotate: -10 },
      { xPercent: -14, yPercent: -4, rotate: 32 },
    ],
  },
};

const WASH_OFF: WashLight = { o: 0, s: 0.8, inset: 0 };

// Shown above the first section, where the hero already has its own wash.
const WASH_REST: WashPattern = {
  tl: WASH_OFF,
  tr: WASH_OFF,
  bl: WASH_OFF,
  br: { o: 0.4, s: 0.9, inset: 2 },
};

// Six corner compositions. Consecutive stages always pick different ones.
const WASH_PATTERNS: WashPattern[] = [
  // 0. Diagonal ↘ : top-left + bottom-right
  {
    tl: { o: 1, s: 1.05, inset: 6 },
    tr: WASH_OFF,
    bl: WASH_OFF,
    br: { o: 0.85, s: 1, inset: 4 },
  },
  // 1. Diagonal ↙ : top-right + bottom-left
  {
    tl: WASH_OFF,
    tr: { o: 1, s: 1.05, inset: 6 },
    bl: { o: 0.85, s: 1, inset: 4 },
    br: WASH_OFF,
  },
  // 2. Top band: both upper corners, hint of bottom-right
  {
    tl: { o: 0.8, s: 0.95, inset: 3 },
    tr: { o: 0.85, s: 0.95, inset: 3 },
    bl: WASH_OFF,
    br: { o: 0.22, s: 0.85, inset: 0 },
  },
  // 3. Bottom band: both lower corners, hint of top-left
  {
    tl: { o: 0.22, s: 0.85, inset: 0 },
    tr: WASH_OFF,
    bl: { o: 0.85, s: 0.95, inset: 3 },
    br: { o: 0.8, s: 0.95, inset: 3 },
  },
  // 4. One large top-right light, small bottom-left counterweight
  {
    tl: WASH_OFF,
    tr: { o: 1, s: 1.3, inset: 10 },
    bl: { o: 0.4, s: 0.8, inset: 0 },
    br: WASH_OFF,
  },
  // 5. One large bottom-left light, small top-right counterweight
  {
    tl: WASH_OFF,
    tr: { o: 0.4, s: 0.8, inset: 0 },
    bl: { o: 1, s: 1.3, inset: 10 },
    br: WASH_OFF,
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Build the fixed layer holding the four corner lights.
 * Structure: layer > corner (pattern tweens) > glow (scroll drift).
 * The layer is a direct child of <body>, which already isolates its stacking
 * context, so z-index -1 sits above the page background and below content.
 */
function createWashLayer(): {
  layer: HTMLElement;
  corners: Record<WashCorner, { corner: HTMLElement; glow: HTMLElement }>;
} {
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.setAttribute('data-corner-wash', '');
  layer.style.cssText =
    'position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;contain:layout paint style;';

  const corners = {} as Record<WashCorner, { corner: HTMLElement; glow: HTMLElement }>;

  WASH_ORDER.forEach((key) => {
    const config = WASH_CORNERS[key];

    const corner = document.createElement('div');
    corner.style.cssText =
      `position:absolute;${config.pos}` +
      'width:clamp(26rem,68vw,62rem);height:clamp(24rem,68vh,52rem);' +
      'opacity:0;will-change:transform,opacity;';

    const glow = document.createElement('div');
    glow.style.cssText =
      `position:absolute;inset:0;border-radius:50%;background:${config.gradient};will-change:transform;`;

    corner.appendChild(glow);
    layer.appendChild(corner);
    corners[key] = { corner, glow };
  });

  document.body.prepend(layer);
  return { layer, corners };
}

function initCornerWash(prefersReducedMotion: boolean): void {
  const washModules = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-module]')).filter(
    (module) => module.id !== 'hero' && module.id !== 'inicio-consultoria'
  );

  const { layer, corners } = createWashLayer();
  washLayer = layer;

  washContext = gsap.context(() => {
    const placement = (key: WashCorner, light: WashLight) => ({
      opacity: light.o,
      scale: light.s,
      xPercent: WASH_CORNERS[key].sx * (WASH_OUT - light.inset),
      yPercent: WASH_CORNERS[key].sy * (WASH_OUT - light.inset),
    });

    const applyPattern = (pattern: WashPattern, immediate: boolean): void => {
      WASH_ORDER.forEach((key) => {
        const target = placement(key, pattern[key]);
        const el = corners[key].corner;

        if (immediate) {
          gsap.set(el, target);
          return;
        }

        // Lights entering ease out slowly; lights leaving fade a bit faster,
        // so the corners hand the glow over instead of popping.
        const entering = target.opacity > Number(gsap.getProperty(el, 'opacity'));
        gsap.to(el, {
          ...target,
          duration: entering ? 1.8 : 1.2,
          ease: entering ? 'power3.out' : 'power2.inOut',
          overwrite: 'auto',
        });
      });
    };

    // Reduced motion: one static composition, no tweens, no drift.
    if (prefersReducedMotion) {
      applyPattern(WASH_PATTERNS[0] ?? WASH_REST, true);
      return;
    }

    // Start unlit but positioned at the rest state; the first pattern applied
    // below fades the right corners in.
    WASH_ORDER.forEach((key) => {
      gsap.set(corners[key].corner, { ...placement(key, WASH_REST[key]), opacity: 0 });
    });

    // Scroll drift: each light wanders inside its corner and its ellipse
    // rotates, so the gradient edge keeps changing while you scroll.
    WASH_ORDER.forEach((key) => {
      gsap.to(corners[key].glow, {
        keyframes: WASH_CORNERS[key].drift.map((step) => ({ ...step, ease: 'sine.inOut' })),
        ease: 'none',
        scrollTrigger: {
          start: 0,
          end: 'max',
          scrub: 1.2,
        },
      });
    });

    if (washModules.length === 0) {
      applyPattern(WASH_REST, false);
      return;
    }

    // Pattern selection. The module closest to the viewport center decides the
    // base pattern; tall modules advance up to two extra steps as you scroll
    // through them, so long sections also change composition.
    let currentIndex = -2; // -1 is the rest state; -2 forces the first apply

    const evaluate = (): void => {
      const viewportHeight = window.innerHeight;
      const center = viewportHeight / 2;

      let bestIndex = -1;
      let bestDistance = Infinity;
      let bestRect: DOMRect | null = null;

      for (let i = 0; i < washModules.length; i += 1) {
        const washModule = washModules[i];
        if (!washModule) continue;

        const rect = washModule.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewportHeight) continue;

        const distance = Math.abs(rect.top + rect.height / 2 - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
          bestRect = rect;
        }
      }

      let nextIndex = -1;
      if (bestRect && bestIndex >= 0) {
        const step = clamp(Math.floor((center - bestRect.top) / (viewportHeight * 1.15)), 0, 2);
        nextIndex = (bestIndex * 3 + step) % WASH_PATTERNS.length;
      }

      if (nextIndex === currentIndex) return;
      currentIndex = nextIndex;
      applyPattern(nextIndex === -1 ? WASH_REST : (WASH_PATTERNS[nextIndex] ?? WASH_REST), false);
    };

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: evaluate,
      onRefresh: evaluate,
    });
    evaluate();
  });
}

/**
 * Clean up existing motion instances, listeners, and ScrollTriggers.
 * Ensures strict idempotence during Astro page navigations or re-inits.
 */
export function cleanupMotion(): void {
  // 1. Revert and clean up GSAP matchMedia & ScrollTriggers
  if (gsapMatchMediaInstance) {
    gsapMatchMediaInstance.revert();
    gsapMatchMediaInstance = null;
  }

  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

  // 2. Remove ticker listener
  if (tickerListener) {
    gsap.ticker.remove(tickerListener);
    tickerListener = null;
  }

  // 3. Remove anchor link listener
  if (clickListener) {
    document.removeEventListener('click', clickListener);
    clickListener = null;
  }

  if (consultingRevealObserver) {
    consultingRevealObserver.disconnect();
    consultingRevealObserver = null;
  }

  // Corner wash: revert its tweens/ScrollTriggers and remove the light layer
  if (washContext) {
    washContext.revert();
    washContext = null;
  }
  if (washLayer) {
    washLayer.remove();
    washLayer = null;
  }
  document.querySelectorAll('[data-corner-wash]').forEach((node) => node.remove());
  // Legacy attribute from the previous wash system (kept so old CSS stays inert)
  document.documentElement.removeAttribute('data-scroll-wash');

  // 4. Destroy Lenis smooth scroll
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}

/**
 * Initialize PerdomoPro Motion System:
 * - Respects prefers-reduced-motion as a first-class priority
 * - Synchronizes Lenis smooth scroll with GSAP ticker & ScrollTrigger
 * - Restrained Hero entrance sequence
 * - Grouped, progressive section reveals
 * - Memorable Process progression scrub line
 * - Responsive adjustments (desktop vs mobile)
 */
export function initMotion(): void {
  // Only execute in the browser
  if (typeof window === 'undefined') return;

  // Clean up any existing instances first
  cleanupMotion();

  // Check accessibility reduced-motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Four soft violet lights anchored to the viewport corners. Scrolling swaps
  // which corners are lit (pattern per section) and slowly drifts the lights.
  initCornerWash(prefersReducedMotion);

  // ----------------------------------------------------
  // 1. LENIS SMOOTH SCROLL SETUP (Bypassed if reduced-motion)
  // ----------------------------------------------------
  if (!prefersReducedMotion) {
    lenisInstance = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.5,
      autoRaf: false,
      respectReducedMotion: true,
    });

    // Synchronize Lenis with GSAP ScrollTrigger
    lenisInstance.on('scroll', ScrollTrigger.update);

    // Drive Lenis via GSAP's central RAF ticker to prevent dual loops
    tickerListener = (time: number) => {
      lenisInstance?.raf(time * 1000);
    };
    gsap.ticker.add(tickerListener);
    gsap.ticker.lagSmoothing(0);

    // Internal anchor smooth scrolling with sticky navbar offset
    clickListener = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      const hashIndex = href.indexOf('#');
      if (hashIndex === -1) return;

      const hash = href.slice(hashIndex);
      if (!hash || hash === '#') return;

      const urlPath = href.slice(0, hashIndex).replace(/\/$/, '');
      const currentPath = window.location.pathname.replace(/\/$/, '');

      // Check if the link points to an anchor on the current page
      if (urlPath === '' || urlPath === currentPath) {
        const destination = document.querySelector(hash);
        if (destination) {
          e.preventDefault();
          lenisInstance?.scrollTo(destination as HTMLElement, {
            offset: -70,
            duration: 1.0,
          });
          history.pushState(null, '', hash);
        }
      }
    };

    document.addEventListener('click', clickListener);
  }

  // ----------------------------------------------------
  // 2. GSAP MATCHMEDIA CHOREOGRAPHY
  // ----------------------------------------------------
  gsapMatchMediaInstance = gsap.matchMedia();

  gsapMatchMediaInstance.add(
    {
      isDesktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
      isMobile: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const { isDesktop, reduceMotion } = context.conditions as {
        isDesktop: boolean;
        isMobile: boolean;
        reduceMotion: boolean;
      };

      // In reduced motion mode, enforce static resting states and exit early
      if (reduceMotion) {
        const progressLine = document.querySelector<HTMLElement>('[data-process-progress]');
        if (progressLine) {
          progressLine.style.transform = 'scaleX(1)';
          progressLine.style.opacity = '0.35';
        }
        return;
      }

      // Responsive motion parameters
      const yOffset = isDesktop ? 14 : 8;
      const duration = isDesktop ? 0.65 : 0.5;

      // Consulting content uses native intersection reveals so blocks never
      // remain hidden if scroll positions change while the page is loading.
      const consultingPage = document.querySelector('[data-consulting-page]');
      if (consultingPage) {
        const revealItems = Array.from(consultingPage.querySelectorAll<HTMLElement>('[data-reveal-item]'));
        if ('IntersectionObserver' in window) {
          consultingRevealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
              }
            });
          }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

          revealItems.forEach((item) => {
            const siblings = Array.from(item.parentElement?.querySelectorAll<HTMLElement>(':scope > [data-reveal-item]') ?? []);
            const stagger = Math.min(Math.max(siblings.indexOf(item), 0), 2);
            item.style.setProperty('--reveal-delay', `${stagger * 70}ms`);
            item.classList.add('consulting-reveal');
            consultingRevealObserver?.observe(item);
          });
        } else {
          revealItems.forEach((item) => item.classList.add('is-visible'));
        }

        // Keep outgoing sections readable while softly shifting focus to the next block.
        const modules = consultingPage.querySelectorAll<HTMLElement>('[data-scroll-module]');
        modules.forEach((module) => {
          gsap.to(module, {
            opacity: 0.94,
            filter: 'blur(1px)',
            ease: 'none',
            scrollTrigger: {
              trigger: module,
              start: 'bottom bottom',
              end: 'bottom 62%',
              scrub: 0.35,
            },
          });
        });
      }


      // --------------------------------------------------
      // A. HERO ENTRANCE SEQUENCE
      // --------------------------------------------------
      const heroBrand = document.querySelector('[data-hero-brand]');
      const heroMetaTop = document.querySelector('[data-hero-meta="top"]');
      const heroCategory = document.querySelector('[data-hero-meta="category"]');
      const heroHeadline = document.querySelector('[data-hero-headline]');
      const heroDesc = document.querySelector('[data-hero-desc]');
      const heroSpecList = document.querySelector('[data-hero-meta="spec-list"]');
      const heroCta = document.querySelector('[data-hero-cta]');
      const heroMetaBottom = document.querySelector('[data-hero-meta="bottom"]');

      if (heroHeadline) {
        const heroTl = gsap.timeline({
          defaults: { ease: 'power2.out', duration },
        });

        // 1. Brand in navbar
        if (heroBrand) {
          heroTl.from(heroBrand, { opacity: 0, y: -4, duration: 0.45 }, 0);
        }

        // 2. Top metadata & category indicator
        const topElements = [heroMetaTop, heroCategory].filter(Boolean);
        if (topElements.length > 0) {
          heroTl.from(topElements, { opacity: 0, y: yOffset * 0.7, stagger: 0.08 }, 0.08);
        }

        // 3. Main editorial headline
        heroTl.from(heroHeadline, { opacity: 0, y: yOffset, duration: duration + 0.1 }, 0.18);

        // 4. Description & technical spec list
        const descElements = [heroDesc, heroSpecList].filter(Boolean);
        if (descElements.length > 0) {
          heroTl.from(descElements, { opacity: 0, y: yOffset, stagger: 0.1 }, 0.32);
        }

        // 5. Action buttons & bottom metadata
        const ctaElements = [heroCta, heroMetaBottom].filter(Boolean);
        if (ctaElements.length > 0) {
          heroTl.from(ctaElements, { opacity: 0, y: yOffset * 0.8, stagger: 0.08 }, 0.44);
        }
      }

      // --------------------------------------------------
      // B. SECTION REVEALS (Subtle, coordinated, single-pass)
      // --------------------------------------------------

      // 1. About
      const aboutSection = document.querySelector('#sobre-mi, #about');
      if (aboutSection) {
        const header = aboutSection.querySelector('header');
        const aside = aboutSection.querySelector('aside');
        const content = aboutSection.querySelector('.lg\\:col-span-8');

        gsap.from([header, aside, content].filter(Boolean), {
          opacity: 0,
          y: yOffset,
          duration,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: aboutSection,
            start: 'top 85%',
            once: true,
          },
        });
      }

      // 2. Professional Experience / Trajectory
      const profileSection = document.querySelector('#recorrido, #trajectory');
      if (profileSection) {
        const header = profileSection.querySelector('header');
        const title = profileSection.querySelector('#profile-heading')?.parentElement;
        const milestones = profileSection.querySelectorAll('article');

        if (header || title) {
          gsap.from([header, title].filter(Boolean), {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: profileSection,
              start: 'top 85%',
              once: true,
            },
          });
        }

        if (milestones.length > 0) {
          gsap.from(milestones, {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.09,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: milestones[0],
              start: 'top 85%',
              once: true,
            },
          });
        }
      }

      // 3. Work Areas
      const areasSection = document.querySelector('#areas');
      if (areasSection) {
        const header = areasSection.querySelector('header');
        const title = areasSection.querySelector('#areas-heading')?.parentElement;
        const cards = areasSection.querySelectorAll('article');

        if (header || title) {
          gsap.from([header, title].filter(Boolean), {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: areasSection,
              start: 'top 85%',
              once: true,
            },
          });
        }

        if (cards.length > 0) {
          gsap.from(cards, {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.07,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: cards[0],
              start: 'top 85%',
              once: true,
            },
          });
        }
      }

      // 4. Selected Projects
      const projectsSection = document.querySelector('#proyectos, #projects');
      if (projectsSection) {
        const header = projectsSection.querySelector('header');
        const title = projectsSection.querySelector('#projects-heading')?.parentElement;
        const projectArticles = projectsSection.querySelectorAll('article');

        if (header || title) {
          gsap.from([header, title].filter(Boolean), {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: projectsSection,
              start: 'top 85%',
              once: true,
            },
          });
        }

        projectArticles.forEach((article) => {
          gsap.from(article, {
            opacity: 0,
            y: yOffset * 1.1,
            duration: duration + 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: article,
              start: 'top 85%',
              once: true,
            },
          });

          // Subtle stagger of schematic pipeline steps inside each article
          const steps = article.querySelectorAll('ol li');
          if (steps.length > 0) {
            gsap.from(steps, {
              opacity: 0,
              x: -4,
              duration: 0.35,
              stagger: 0.06,
              ease: 'power2.out',
              delay: 0.15,
              scrollTrigger: {
                trigger: article,
                start: 'top 80%',
                once: true,
              },
            });
          }
        });
      }

      // --------------------------------------------------
      // C. MEMORABLE INTERACTION: PROCESS PROGRESSION
      // --------------------------------------------------
      const processSection = document.querySelector('#proceso, #process');
      if (processSection) {
        const header = processSection.querySelector('header');
        const title = processSection.querySelector('#process-heading')?.parentElement;
        const track = processSection.querySelector('[data-process-track]');
        const progressLine = processSection.querySelector<HTMLElement>('[data-process-progress]');
        const stages = processSection.querySelectorAll('[data-process-stage]');

        if (header || title) {
          gsap.from([header, title].filter(Boolean), {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: processSection,
              start: 'top 85%',
              once: true,
            },
          });
        }

        // Memorable interaction: scroll-linked pipeline line scrub
        if (track && progressLine) {
          gsap.fromTo(
            progressLine,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: track,
                start: isDesktop ? 'top 80%' : 'top 85%',
                end: isDesktop ? 'bottom 70%' : 'bottom 80%',
                scrub: 0.3,
              },
            }
          );
        }

        if (stages.length > 0 && track) {
          gsap.from(stages, {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.07,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: track,
              start: 'top 85%',
              once: true,
            },
          });
        }
      }

      // 5. Stack
      const stackSection = document.querySelector('#stack');
      if (stackSection) {
        const header = stackSection.querySelector('header');
        const title = stackSection.querySelector('#stack-heading')?.parentElement;
        const categories = stackSection.querySelectorAll('article');

        if (header || title) {
          gsap.from([header, title].filter(Boolean), {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: stackSection,
              start: 'top 85%',
              once: true,
            },
          });
        }

        if (categories.length > 0) {
          gsap.from(categories, {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.06,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: categories[0],
              start: 'top 85%',
              once: true,
            },
          });
        }
      }

      // 6. Currently
      const currentlySection = document.querySelector('#currently');
      if (currentlySection) {
        const header = currentlySection.querySelector('header');
        const title = currentlySection.querySelector('#currently-heading')?.parentElement;
        const topicCards = currentlySection.querySelectorAll('article');

        if (header || title) {
          gsap.from([header, title].filter(Boolean), {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: currentlySection,
              start: 'top 85%',
              once: true,
            },
          });
        }

        if (topicCards.length > 0) {
          gsap.from(topicCards, {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.07,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: topicCards[0],
              start: 'top 85%',
              once: true,
            },
          });
        }
      }

      // 7. Contact
      const contactSection = document.querySelector('#contacto, #contact');
      if (contactSection) {
        const header = contactSection.querySelector('header');
        const content = contactSection.querySelector('.lg\\:col-span-8');
        const aside = contactSection.querySelector('aside');

        gsap.from([header, content, aside].filter(Boolean), {
          opacity: 0,
          y: yOffset,
          duration,
          stagger: 0.09,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: contactSection,
            start: 'top 85%',
            once: true,
          },
        });
      }

      // 8. Footer
      const footerEl = document.querySelector('footer');
      if (footerEl) {
        const footerInner = footerEl.querySelector('.max-w-7xl');
        if (footerInner) {
          gsap.from(footerInner, {
            opacity: 0,
            y: yOffset * 0.8,
            duration,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: footerEl,
              start: 'top 95%',
              once: true,
            },
          });
        }
      }
    }
  );

  // Refresh ScrollTrigger calculations after all initial setup
  ScrollTrigger.refresh();
}