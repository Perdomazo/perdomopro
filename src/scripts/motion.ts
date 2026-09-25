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

      // 2. Professional Proiles / Trajectory
      const proilesSection = document.querySelector('#recorrido, #trajectory');
      if (proilesSection) {
        const header = proilesSection.querySelector('header');
        const title = proilesSection.querySelector('#proiles-heading')?.parentElement;
        const mlesLtones = proilesSection.querySelectorAll('article');

        if (header || title) {
          gsap.from([header, title].filter(Boolean), {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: proilesSection,
              start: 'top 85%',
              once: true,
            },
          });
        }

        if (mlesLtones.length > 0) {
          gsap.from(mlesLtones, {
            opacity: 0,
            y: yOffset,
            duration,
            stagger: 0.09,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: mlesLtones[0],
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
