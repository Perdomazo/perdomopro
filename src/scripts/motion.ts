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
// Two big, diffuse violet lights. At the top of the page they sit in the
// upper-left and upper-right corners; while you scroll they slide down along
// the side edges and settle in the lower-left and lower-right corners at the
// end of the page. They never cross the content column. Along the way each
// light leans inward, tilts and breathes a little, so the glow keeps changing.
// Both lights share the same gradient (mirrored by position), so neither side
// can outweigh the other.
// ----------------------------------------------------
type WashSide = 'left' | 'right';

interface WashStep {
  /** How far the light leans toward the center, in % of its width */
  inward: number;
  /** Rotation of the ellipse, in degrees (mirrored on the right side) */
  tilt: number;
  scale: number;
  alpha: number;
}

const WASH_SIDES: WashSide[] = ['left', 'right'];

/** % of its width a light sits outside the viewport edge */
const WASH_OUT = 36;
/** Vertical center of the lights at scroll 0 / at the end of the page (fraction of viewport height) */
const WASH_TOP = 0.03;
const WASH_BOTTOM = 0.97;

const WASH_GRADIENT =
  'radial-gradient(ellipse at center,' +
  ' rgb(108 78 156 / 26%) 0%,' +
  ' rgb(118 90 163 / 20%) 20%,' +
  ' rgb(140 114 178 / 11%) 42%,' +
  ' rgb(165 145 195 / 4%) 62%,' +
  ' transparent 78%)';

const WASH_SIDE_CONFIG: Record<
  WashSide,
  { dir: -1 | 1; pos: string; lag: number; steps: WashStep[] }
> = {
  left: {
    dir: -1,
    pos: 'left:0;',
    lag: 0,
    steps: [
      { inward: 9, tilt: 22, scale: 1.06, alpha: 0.92 },
      { inward: 3, tilt: -10, scale: 0.97, alpha: 1 },
      { inward: 12, tilt: 26, scale: 1.1, alpha: 0.9 },
      { inward: 2, tilt: -6, scale: 1, alpha: 1 },
    ],
  },
  right: {
    dir: 1,
    pos: 'right:0;',
    // The right light starts a hair later, so the pair never moves in lockstep
    lag: 0.04,
    steps: [
      { inward: 6, tilt: 16, scale: 1.04, alpha: 0.94 },
      { inward: 11, tilt: -12, scale: 1.08, alpha: 0.9 },
      { inward: 2, tilt: 20, scale: 0.98, alpha: 1 },
      { inward: 8, tilt: -4, scale: 1.05, alpha: 0.95 },
    ],
  },
};

// The hero ships its own asymmetric radial wash (and a white fade at its
// bottom edge). The corner lights replace it, so it is neutralized while the
// motion system is active and restored on cleanup.
let heroWashBackups: { el: HTMLElement; backgroundImage: string }[] = [];

function neutralizeHeroWash(): void {
  heroWashBackups = Array.from(document.querySelectorAll<HTMLElement>('.hero-wash')).map((el) => {
    const backup = { el, backgroundImage: el.style.backgroundImage };
    el.style.backgroundImage = 'none';
    return backup;
  });
}

function restoreHeroWash(): void {
  heroWashBackups.forEach(({ el, backgroundImage }) => {
    el.style.backgroundImage = backgroundImage;
  });
  heroWashBackups = [];
}

/**
 * Build the fixed layer holding the two lights.
 * Structure: layer > corner (scroll travel) > glow (lean / tilt / breathing).
 * The layer is a direct child of <body>, which already isolates its stacking
 * context, so z-index -1 sits above the page background and below content.
 */
function createWashLayer(): {
  layer: HTMLElement;
  lights: Record<WashSide, { corner: HTMLElement; glow: HTMLElement }>;
} {
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.setAttribute('data-corner-wash', '');
  layer.style.cssText =
    'position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;contain:layout paint style;';

  const lights = {} as Record<WashSide, { corner: HTMLElement; glow: HTMLElement }>;

  WASH_SIDES.forEach((side) => {
    const corner = document.createElement('div');
    corner.style.cssText =
      `position:absolute;top:0;${WASH_SIDE_CONFIG[side].pos}` +
      'width:clamp(32rem,88vw,86rem);height:clamp(32rem,90vh,74rem);' +
      'opacity:0;will-change:transform,opacity;';

    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${WASH_GRADIENT};will-change:transform,opacity;`;

    corner.appendChild(glow);
    layer.appendChild(corner);
    lights[side] = { corner, glow };
  });

  document.body.prepend(layer);
  return { layer, lights };
}

function initCornerWash(prefersReducedMotion: boolean): void {
  neutralizeHeroWash();

  const { layer, lights } = createWashLayer();
  washLayer = layer;

  // Y translation that puts a light's center at a fraction of the viewport height
  const yAt = (el: HTMLElement, fraction: number): number =>
    window.innerHeight * fraction - el.offsetHeight / 2;

  washContext = gsap.context(() => {
    // Resting placement: lights outside the edge by WASH_OUT %, centered near the top corners
    WASH_SIDES.forEach((side) => {
      const { corner } = lights[side];
      gsap.set(corner, {
        xPercent: WASH_SIDE_CONFIG[side].dir * WASH_OUT,
        y: yAt(corner, WASH_TOP),
      });
    });

    // Reduced motion: lights stay in the upper corners, no tweens, no scroll travel.
    if (prefersReducedMotion) {
      WASH_SIDES.forEach((side) => gsap.set(lights[side].corner, { opacity: 1 }));
      return;
    }

    // Fade in once the hero starts settling
    gsap.to(
      WASH_SIDES.map((side) => lights[side].corner),
      { opacity: 1, duration: 1.8, delay: 0.2, ease: 'power2.out' }
    );

    // One scrubbed timeline across the whole page: the lights travel from the
    // top corners to the bottom corners while leaning, tilting and breathing.
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        start: 0,
        end: 'max',
        scrub: 1.4,
        invalidateOnRefresh: true,
      },
    });

    WASH_SIDES.forEach((side) => {
      const { corner, glow } = lights[side];
      const config = WASH_SIDE_CONFIG[side];

      // Travel down the edge (eased so the lights linger in the corners at both ends)
      tl.fromTo(
        corner,
        { y: () => yAt(corner, WASH_TOP) },
        { y: () => yAt(corner, WASH_BOTTOM), ease: 'sine.inOut', duration: 1 - config.lag },
        config.lag
      );

      // Lean inward, tilt and breathe along the way
      tl.to(
        glow,
        {
          keyframes: config.steps.map((step) => ({
            xPercent: -config.dir * step.inward,
            rotate: -config.dir * step.tilt,
            scale: step.scale,
            opacity: step.alpha,
            ease: 'sine.inOut',
          })),
          duration: 1,
        },
        0
      );
    });
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
  restoreHeroWash();
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

  // Two diffuse violet lights: upper corners at the top of the page, sliding
  // down the side edges to the lower corners as you scroll.
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
          onComplete: () => {
            gsap.set(
              [heroBrand, heroMetaTop, heroCategory, heroHeadline, heroDesc, heroSpecList, heroCta, heroMetaBottom].filter(Boolean),
              { clearProps: 'opacity,transform' }
            );
          },
        });

        // 1. Brand in navbar
        if (heroBrand) {
          heroTl.from(heroBrand, { opacity: 0, y: -4, duration: 0.45, clearProps: 'opacity,transform' }, 0);
        }

        // 2. Top metadata & category indicator
        const topElements = [heroMetaTop, heroCategory].filter(Boolean);
        if (topElements.length > 0) {
          heroTl.from(topElements, { opacity: 0, y: yOffset * 0.7, stagger: 0.08, clearProps: 'opacity,transform' }, 0.08);
        }

        // 3. Main editorial headline
        heroTl.from(heroHeadline, { opacity: 0, y: yOffset, duration: duration + 0.1, clearProps: 'opacity,transform' }, 0.18);

        // 4. Description & technical spec list
        const descElements = [heroDesc, heroSpecList].filter(Boolean);
        if (descElements.length > 0) {
          heroTl.from(descElements, { opacity: 0, y: yOffset, stagger: 0.1, clearProps: 'opacity,transform' }, 0.32);
        }

        // 5. Action buttons & bottom metadata
        const ctaElements = [heroCta, heroMetaBottom].filter(Boolean);
        if (ctaElements.length > 0) {
          heroTl.from(ctaElements, { opacity: 0, y: yOffset * 0.8, stagger: 0.08, clearProps: 'opacity,transform' }, 0.44);
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
          clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
              clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
          clearProps: 'opacity,transform',
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
            clearProps: 'opacity,transform',
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
