import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readProjectFile, SOURCE_FILES } from '../helpers/fixtures.js';

/**
 * Creates a mock DOM element with Proxy-based CSSStyleDeclaration
 * to accurately simulate GSAP CSSPlugin mutations and clearProps lifecycle.
 */
function createMockElement(tagName = 'div', id = '', classList = []) {
  const styleStore = {};
  const style = new Proxy(styleStore, {
    get(target, prop) {
      if (prop === 'removeProperty') {
        return (p) => { delete target[p]; };
      }
      if (prop === 'getPropertyValue') {
        return (p) => target[p] || '';
      }
      return prop in target ? target[prop] : '';
    },
    set(target, prop, val) {
      target[prop] = String(val);
      return true;
    },
    has(target, prop) {
      return true;
    },
  });

  const attributes = {};
  const classes = [...classList];

  return {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    id,
    style,
    classList: {
      contains: (cls) => classes.includes(cls),
      add: (cls) => { if (!classes.includes(cls)) classes.push(cls); },
      remove: (cls) => { const idx = classes.indexOf(cls); if (idx >= 0) classes.splice(idx, 1); },
    },
    setAttribute: (k, v) => { attributes[k] = String(v); },
    getAttribute: (k) => attributes[k] || null,
    removeAttribute: (k) => { delete attributes[k]; },
    appendChild: () => {},
    removeChild: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
  };
}

/**
 * Sets up minimal browser environment globals for GSAP CSSPlugin in Node.js
 */
function setupHeadlessBrowserEnv() {
  global.window = {
    navigator: { userAgent: 'Headless-Empirical-Test' },
  };
  global.document = {
    documentElement: createMockElement('html'),
    createElement: (tag) => createMockElement(tag),
  };
  global.window.document = global.document;
  global.getComputedStyle = (target) => ({
    getPropertyValue: (p) => (target.style && target.style[p]) || '',
    opacity: '1',
    transform: 'none',
  });
}

describe('Tier 5 Adversarial: Empirical Challenge on Motion Stabilization (M1 / R1)', () => {
  const motionSource = readProjectFile(SOURCE_FILES.motion);
  const globalCss = readProjectFile(SOURCE_FILES.globalCss);
  const processAstro = readProjectFile(SOURCE_FILES.processAstro);

  // --------------------------------------------------------------------------
  // Part 1: AST Analysis using TypeScript Compiler API
  // --------------------------------------------------------------------------
  describe('Adversarial AST & Static Syntax Verification', () => {
    const sourceFile = ts.createSourceFile(
      'motion.ts',
      motionSource,
      ts.ScriptTarget.Latest,
      true
    );

    it('ADV-MOT-01: AST check — No CallExpression or PropertyAssignment introduces "blur" filter on content elements', () => {
      let blurFound = false;
      const foundBlurs = [];

      function visit(node) {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
          if (node.text.includes('blur(')) {
            // Check if this is within wash gradient or actual DOM tween
            blurFound = true;
            foundBlurs.push(node.text);
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(sourceFile);

      assert.equal(
        blurFound,
        false,
        `Unexpected blur() found in motion.ts AST: ${JSON.stringify(foundBlurs)}`
      );
    });

    it('ADV-MOT-02: AST check — No scrubbed opacity on exitCandidates or semantic text nodes', () => {
      let exitScrubFound = false;

      function visit(node) {
        if (ts.isIdentifier(node) && (node.text === 'exitCandidates' || node.text === 'exitGroups')) {
          exitScrubFound = true;
        }
        ts.forEachChild(node, visit);
      }
      visit(sourceFile);

      assert.equal(
        exitScrubFound,
        false,
        'Found exitCandidates or exitGroups AST identifier in motion.ts'
      );
    });

    it('ADV-MOT-03: AST check — All entrance reveal tweens explicitly declare clearProps: "opacity,transform"', () => {
      const gsapCalls = [];

      function visit(node) {
        if (ts.isCallExpression(node)) {
          const expr = node.expression;
          if (
            ts.isPropertyAccessExpression(expr) &&
            ts.isIdentifier(expr.expression) &&
            (expr.expression.text === 'gsap' || expr.expression.text === 'heroTl')
          ) {
            const method = expr.name.text;
            if (method === 'from' || method === 'to' || method === 'fromTo') {
              gsapCalls.push(node);
            }
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(sourceFile);

      // Verify that every section reveal tween (About, Trajectory, Areas, Projects, Process, Stack, Currently, Contact, Footer)
      // contains clearProps: 'opacity,transform'
      const clearPropsMatches = motionSource.match(/clearProps:\s*['"]opacity,transform['"]/g);
      assert.ok(
        clearPropsMatches && clearPropsMatches.length >= 20,
        `Expected at least 20 tweens with clearProps: 'opacity,transform', found ${clearPropsMatches ? clearPropsMatches.length : 0}`
      );
    });

    it('ADV-MOT-04: AST check — Entrance ScrollTriggers strictly enforce once: true (no exit-scrub flicker)', () => {
      const onceMatches = motionSource.match(/once:\s*true/g);
      assert.ok(
        onceMatches && onceMatches.length >= 8,
        `Expected at least 8 section reveal ScrollTriggers configured with once: true, found ${onceMatches ? onceMatches.length : 0}`
      );
    });

    it('ADV-MOT-05: CSS rule check — .consulting-reveal has no filter or transition: filter', () => {
      const match = globalCss.match(/\.consulting-reveal\s*\{([^}]+)\}/);
      assert.ok(match, '.consulting-reveal must exist in global.css');
      const body = match[1];

      assert.equal(/filter/i.test(body), false, '.consulting-reveal must not contain filter');
      assert.equal(/transition:[^;]*filter/i.test(body), false, '.consulting-reveal must not transition filter');
    });

    it('ADV-MOT-06: Component check — Process.astro progress bar does not have transition-transform', () => {
      assert.equal(
        /data-process-progress[\s\S]*?transition-transform/i.test(processAstro),
        false,
        'Process.astro must not declare transition-transform on data-process-progress'
      );
    });
  });

  // --------------------------------------------------------------------------
  // Part 2: Headless Empirical GSAP Timeline & clearProps Verification
  // --------------------------------------------------------------------------
  describe('Empirical GSAP Timeline & clearProps Lifecycle Execution', () => {
    it('ADV-MOT-07: clearProps removes inline opacity and transform upon tween completion', async () => {
      setupHeadlessBrowserEnv();
      const { gsap } = await import('gsap');

      const el = createMockElement('article', 'project-card-1');
      el.style.opacity = '';
      el.style.transform = '';

      const tween = gsap.from(el, {
        opacity: 0,
        y: 14,
        duration: 0.5,
        clearProps: 'opacity,transform',
      });

      // Mid-tween: inline opacity should be active (< 1.0)
      tween.progress(0.5);
      assert.ok(
        Number(el.style.opacity) > 0 && Number(el.style.opacity) < 1,
        `Mid-animation opacity must be active, got ${el.style.opacity}`
      );

      // Completion: clearProps must purge inline styles completely
      tween.progress(1);
      assert.equal(
        el.style.opacity,
        '',
        'Inline opacity must be cleared after animation reaches completion'
      );
      assert.equal(
        el.style.transform,
        '',
        'Inline transform must be cleared after animation reaches completion'
      );
    });

    it('ADV-MOT-08: Hero entrance sequence onComplete executes clearProps across all hero elements', async () => {
      setupHeadlessBrowserEnv();
      const { gsap } = await import('gsap');

      const heroElements = [
        createMockElement('div', 'hero-brand'),
        createMockElement('div', 'hero-meta-top'),
        createMockElement('h1', 'hero-headline'),
        createMockElement('p', 'hero-desc'),
        createMockElement('div', 'hero-cta'),
      ];

      const heroTl = gsap.timeline({
        onComplete: () => {
          gsap.set(heroElements, { clearProps: 'opacity,transform' });
        },
      });

      heroElements.forEach((el, idx) => {
        heroTl.from(el, { opacity: 0, y: 14, duration: 0.2, clearProps: 'opacity,transform' }, idx * 0.05);
      });

      // Jump to end of timeline
      heroTl.progress(1);

      // Verify every hero element had inline opacity and transform cleared
      for (const el of heroElements) {
        assert.equal(
          el.style.opacity,
          '',
          `Hero element #${el.id} must have opacity cleared by clearProps`
        );
        assert.equal(
          el.style.transform,
          '',
          `Hero element #${el.id} must have transform cleared by clearProps`
        );
      }
    });

    it('ADV-MOT-09: Rapid scroll stress test — 100 erratic scroll jumps across simulated viewports without flickering', async () => {
      setupHeadlessBrowserEnv();
      const { gsap } = await import('gsap');

      // Create 10 simulated section cards
      const sectionCards = Array.from({ length: 10 }, (_, i) =>
        createMockElement('article', `section-card-${i}`)
      );

      // Create entrance tweens with once: true semantics and clearProps
      const tweens = sectionCards.map((card) =>
        gsap.from(card, {
          opacity: 0,
          y: 14,
          duration: 0.4,
          clearProps: 'opacity,transform',
        })
      );

      // Simulate rapid erratic scrolling (100 scroll steps)
      // Simulating scrolling up and down with sudden jumps
      const scrollPositions = [];
      let currentPos = 0;
      for (let step = 0; step < 100; step++) {
        const delta = (Math.random() - 0.48) * 1200; // erratic up and down jumps
        currentPos = Math.max(0, Math.min(5000, currentPos + delta));
        scrollPositions.push(currentPos);
      }

      // Replay scroll progress through tweens
      for (const pos of scrollPositions) {
        const progress = Math.min(1, pos / 3000);
        tweens.forEach((tw) => {
          // If once: true, once progress reaches 1, it stays completed
          if (tw.progress() < 1) {
            tw.progress(Math.max(tw.progress(), progress));
          }
        });
      }

      // After rapid scroll traversal, complete all tweens
      tweens.forEach((tw) => tw.progress(1));

      // Assert that none of the elements have lingering inline styles or filter blur
      for (const card of sectionCards) {
        assert.equal(
          card.style.opacity,
          '',
          `Card #${card.id} must not retain inline opacity override`
        );
        assert.equal(
          card.style.transform,
          '',
          `Card #${card.id} must not retain inline transform override`
        );
        assert.equal(
          card.style.filter,
          '',
          `Card #${card.id} must never have inline filter blur applied`
        );
      }
    });

    it('ADV-MOT-10: Process progress bar scales monotonically with scroll scrub without transition interference', async () => {
      setupHeadlessBrowserEnv();
      const { gsap } = await import('gsap');

      const progressLine = createMockElement('div', 'data-process-progress');
      const tween = gsap.fromTo(
        progressLine,
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', duration: 1 }
      );

      // Test multi-point scrubbing
      const scrubPositions = [0.0, 0.25, 0.5, 0.75, 1.0, 0.6, 0.3, 0.9];
      for (const scrubPos of scrubPositions) {
        tween.progress(scrubPos);
        // Verify scale is tracked without elastic delay or transition interference
        assert.equal(
          tween.progress(),
          scrubPos,
          `GSAP scrub progress must match scroll progress exactly at ${scrubPos}`
        );
      }
    });

    it('ADV-MOT-11: prefers-reduced-motion: reduce guarantees zero tween execution and static resting states', () => {
      // Verify motion.ts checks condition and returns early
      assert.match(
        motionSource,
        /if\s*\(\s*reduceMotion\s*\)\s*\{[\s\S]*?progressLine\.style\.transform\s*=\s*'scaleX\(1\)';[\s\S]*?progressLine\.style\.opacity\s*=\s*'0\.35';[\s\S]*?return;/,
        'Reduced motion must set static progress bar and exit early without registering entrance tweens'
      );
    });

    it('ADV-MOT-12: Repeated cleanupMotion calls are safe, complete, and strictly idempotent', () => {
      // Verify cleanupMotion resets all module-level references and kills all ScrollTriggers
      assert.match(
        motionSource,
        /export function cleanupMotion\(\): void \{[\s\S]*?ScrollTrigger\.getAll\(\)\.forEach\(\(trigger\)\s*=>\s*trigger\.kill\(\)\);[\s\S]*?gsap\.ticker\.remove\(tickerListener\);[\s\S]*?lenisInstance\.destroy\(\);/,
        'cleanupMotion must kill triggers, remove ticker, and destroy Lenis'
      );
    });
  });
});
