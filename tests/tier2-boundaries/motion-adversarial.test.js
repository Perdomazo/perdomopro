import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES, DIST_FILES, fileExists } from '../helpers/fixtures.js';
import { parseHtml, querySelectorAll, byClass } from '../helpers/dom.js';

describe('Tier 2 Adversarial Stress Suite: Motion Stabilization & Reduced-Motion Boundaries', () => {
  const motionSource = readProjectFile(SOURCE_FILES.motion);
  const globalCss = readProjectFile(SOURCE_FILES.globalCss);
  const processAstro = readProjectFile(SOURCE_FILES.processAstro);

  // ---------------------------------------------------------------------------
  // 1. Reduced-Motion Boundary Conditions (Static & Dynamic)
  // ---------------------------------------------------------------------------
  describe('Reduced-Motion Boundary Conditions', () => {
    it('ADV-MOT-01: Static CSS enforces 100% immediate visibility and zero transition durations under reduced motion', () => {
      // Must target universal selector *, *::before, *::after
      const reducedBlockMatch = globalCss.match(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{([\s\S]*?)\n\}/);
      assert.ok(reducedBlockMatch, 'global.css must have @media (prefers-reduced-motion: reduce) block');
      const reducedCss = reducedBlockMatch[1];

      // Duration must be clamped to 0.01ms !important
      assert.match(
        reducedCss,
        /transition-duration:\s*0\.01ms\s*!important/,
        'transition-duration must be forced to 0.01ms !important'
      );
      assert.match(
        reducedCss,
        /animation-duration:\s*0\.01ms\s*!important/,
        'animation-duration must be forced to 0.01ms !important'
      );
      // Delays must be forced to 0ms !important to eliminate waiting lag
      assert.match(
        reducedCss,
        /transition-delay:\s*0ms\s*!important/,
        'transition-delay must be forced to 0ms !important'
      );
      assert.match(
        reducedCss,
        /animation-delay:\s*0ms\s*!important/,
        'animation-delay must be forced to 0ms !important'
      );
      // Scroll behavior must be auto !important to prevent animated smooth scroll
      assert.match(
        reducedCss,
        /scroll-behavior:\s*auto\s*!important/,
        'scroll-behavior must be forced to auto !important'
      );
    });

    it('ADV-MOT-02: Consulting reveal components are immediately visible with zero transforms and no transitions in reduced-motion mode', () => {
      const reducedBlockMatch = globalCss.match(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{([\s\S]*?)\n\}/);
      const reducedCss = reducedBlockMatch[1];

      // .consulting-reveal must be immediately visible (opacity: 1) without transform or transitions
      assert.match(
        reducedCss,
        /\.consulting-reveal[\s\S]*?opacity:\s*1/,
        '.consulting-reveal must have opacity: 1 in reduced-motion'
      );
      assert.match(
        reducedCss,
        /\.consulting-reveal[\s\S]*?transform:\s*none/,
        '.consulting-reveal must have transform: none in reduced-motion'
      );
      assert.match(
        reducedCss,
        /\.consulting-reveal[\s\S]*?transition:\s*none/,
        '.consulting-reveal must have transition: none in reduced-motion'
      );
      assert.match(
        reducedCss,
        /\.consulting-reveal[\s\S]*?will-change:\s*auto/,
        '.consulting-reveal must release will-change in reduced-motion'
      );
    });

    it('ADV-MOT-03: Process progress bar is pinned statically at 100% scale in reduced-motion mode without scrub lag', () => {
      const reducedBlockMatch = globalCss.match(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{([\s\S]*?)\n\}/);
      const reducedCss = reducedBlockMatch[1];

      assert.match(
        reducedCss,
        /\[data-process-progress\][\s\S]*?transform:\s*scaleX\(1\)\s*!important/,
        '[data-process-progress] must be statically scaled to 100% under reduced-motion'
      );
      assert.match(
        reducedCss,
        /\[data-process-progress\][\s\S]*?opacity:\s*0\.35\s*!important/,
        '[data-process-progress] must maintain restrained static opacity under reduced-motion'
      );
    });

    it('ADV-MOT-04: Corner wash lights short-circuit to static upper corner placement without scrub timeline when reduced-motion is requested', () => {
      // In initCornerWash:
      // if (prefersReducedMotion) {
      //   WASH_SIDES.forEach((side) => gsap.set(lights[side].corner, { opacity: 1 }));
      //   return;
      // }
      const cornerWashShortCircuit = /initCornerWash\(prefersReducedMotion:\s*boolean\)[\s\S]*?if\s*\(\s*prefersReducedMotion\s*\)\s*\{[\s\S]*?return;/;
      assert.match(
        motionSource,
        cornerWashShortCircuit,
        'Corner wash must short-circuit and return early if prefersReducedMotion is true, preventing timeline creation'
      );
    });

    it('ADV-MOT-05: GSAP MatchMedia handler exits immediately under reduceMotion condition, scheduling 0 section tweens', () => {
      // In gsapMatchMediaInstance.add(...):
      // if (reduceMotion) { ... return; }
      const matchMediaEarlyExit = /if\s*\(\s*reduceMotion\s*\)\s*\{[\s\S]*?return;\s*\}/;
      assert.match(
        motionSource,
        matchMediaEarlyExit,
        'GSAP matchMedia must exit immediately when reduceMotion condition matches'
      );

      // Verify that after early return, no entrance reveal tweens execute
      const exitIndex = motionSource.indexOf('if (reduceMotion)');
      const firstSectionRevealIndex = motionSource.indexOf('// 1. About');
      assert.ok(
        exitIndex > 0 && firstSectionRevealIndex > exitIndex,
        'reduceMotion guard must be located before any section reveal animations'
      );
    });

    it('ADV-MOT-06: Lenis smooth scroll engine is completely bypassed when reduced-motion is active', () => {
      // Lenis initialization block must be guarded by !prefersReducedMotion
      const lenisGuard = /if\s*\(\s*!prefersReducedMotion\s*\)\s*\{[\s\S]*?lenisInstance\s*=\s*new Lenis/;
      assert.match(
        motionSource,
        lenisGuard,
        'Lenis instantiation must be strictly guarded by !prefersReducedMotion'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. CSS Transition Collision Boundaries & Layer Thrashing Prevention
  // ---------------------------------------------------------------------------
  describe('CSS Transition Collision Boundaries', () => {
    it('ADV-COL-01: .transition-card strictly isolates transition-property to transform, border-color, box-shadow', () => {
      const cardMatch = globalCss.match(/\.transition-card\s*\{([\s\S]*?)\}/);
      assert.ok(cardMatch, '.transition-card rule must exist in global.css');
      const cardCss = cardMatch[1];

      assert.match(
        cardCss,
        /transition-property:\s*transform,\s*border-color,\s*box-shadow;/,
        '.transition-card must explicitly define transition-property strictly without opacity or filter'
      );

      // Must NOT contain transition: all or transition-property: all
      assert.doesNotMatch(
        cardCss,
        /transition(?:-property)?:\s*all/i,
        '.transition-card must NOT use "all", which collides with entrance opacity animations'
      );

      // Must NOT contain filter or opacity transitions
      assert.doesNotMatch(
        cardCss,
        /transition(?:-property)?:[^;]*(?:filter|opacity)/i,
        '.transition-card must NOT transition filter or opacity'
      );
    });

    it('ADV-COL-02: .transition-card transitions are neutralized to none in reduced-motion mode', () => {
      const reducedBlockMatch = globalCss.match(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{([\s\S]*?)\n\}/);
      const reducedCss = reducedBlockMatch[1];

      assert.match(
        reducedCss,
        /\.transition-card\s*\{[\s\S]*?transition:\s*none\s*!important;[\s\S]*?\}/,
        '.transition-card must set transition: none !important in prefers-reduced-motion: reduce'
      );
    });

    it('ADV-COL-03: All GSAP entrance tweens across all 8 content sections purge inline styles via clearProps', () => {
      // Section tweens must declare clearProps: 'opacity,transform' so hover transforms work unhindered afterwards
      const clearPropsMatches = motionSource.match(/clearProps:\s*['"]opacity,transform['"]/g);
      assert.ok(
        clearPropsMatches && clearPropsMatches.length >= 10,
        `Expected at least 10 occurrences of clearProps: 'opacity,transform', found ${clearPropsMatches ? clearPropsMatches.length : 0}`
      );

      // Specifically check hero timeline onComplete clears all hero elements
      assert.match(
        motionSource,
        /onComplete:\s*\(\)\s*=>\s*\{[\s\S]*?clearProps:\s*['"]opacity,transform['"][\s\S]*?\}/,
        'Hero timeline onComplete must call gsap.set with clearProps: opacity,transform'
      );
    });

    it('ADV-COL-04: Process progress bar in Process.astro has no transition-transform to prevent ticker scrubbing lag', () => {
      // Verify Process.astro progress bar class
      const progressLineMatch = processAstro.match(/<div[^>]*data-process-progress[^>]*>/);
      assert.ok(progressLineMatch, 'Process.astro must contain data-process-progress element');
      assert.doesNotMatch(
        progressLineMatch[0],
        /transition-transform/,
        'data-process-progress must not include transition-transform class'
      );
    });

    it('ADV-COL-05: Absolute absence of exit candidate querySelector on text tags and blur/opacity exit scrubbing', () => {
      assert.doesNotMatch(
        motionSource,
        /exitCandidates/i,
        'motion.ts must not contain exitCandidates array or logic'
      );
      assert.doesNotMatch(
        motionSource,
        /filter:\s*['"][^'"]*blur/i,
        'motion.ts must not contain filter: blur(...) in any GSAP tween'
      );
      assert.doesNotMatch(
        motionSource,
        /filter:\s*['"][^'"]*opacity/i,
        'motion.ts must not contain filter: opacity(...) in any GSAP tween'
      );
    });

    it('ADV-COL-06: .consulting-reveal will-change transitions to auto upon becoming visible to avoid GPU layer accumulation', () => {
      const consultingVisibleMatch = globalCss.match(/\.consulting-reveal\.is-visible\s*\{([\s\S]*?)\}/);
      assert.ok(consultingVisibleMatch, '.consulting-reveal.is-visible must exist');
      const visibleCss = consultingVisibleMatch[1];

      assert.match(
        visibleCss,
        /will-change:\s*auto;/,
        '.consulting-reveal.is-visible must release hardware layer via will-change: auto'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Layout Shift (CLS) Resistance
  // ---------------------------------------------------------------------------
  describe('Layout Shift (CLS) Resistance', () => {
    it('ADV-CLS-01: Entrance reveals use compositor translateY offset instead of layout-altering margin/top', () => {
      // In consulting-reveal:
      assert.match(
        globalCss,
        /\.consulting-reveal\s*\{[\s\S]*?transform:\s*translateY\(0\.65rem\);/,
        '.consulting-reveal uses compositor translateY rather than top/margin'
      );

      // In motionSource:
      assert.match(
        motionSource,
        /yOffset\s*=\s*isDesktop\s*\?\s*14\s*:\s*8/,
        'motion.ts uses yOffset (GSAP translateY) for section reveals'
      );

      // Check that top / margin-top are never tweened for reveals
      assert.doesNotMatch(
        motionSource,
        /gsap\.from\([^)]*\{\s*marginTop:/,
        'motion.ts must never tween marginTop'
      );
      assert.doesNotMatch(
        motionSource,
        /gsap\.from\([^)]*\{\s*top:/,
        'motion.ts must never tween top'
      );
    });

    it('ADV-CLS-02: Static HTML builds render content in normal document flow', () => {
      if (fileExists(DIST_FILES.index)) {
        const indexHtml = readProjectFile(DIST_FILES.index);
        const doc = parseHtml(indexHtml);
        const cardElements = querySelectorAll(doc, byClass('transition-card'));
        // In the static output, items with transition-card exist without hidden inline styles
        for (const card of cardElements) {
          const style = card.attrs?.find((a) => a.name === 'style')?.value || '';
          assert.doesNotMatch(
            style,
            /visibility:\s*hidden/i,
            'Cards must never be statically rendered with visibility: hidden'
          );
          assert.doesNotMatch(
            style,
            /display:\s*none/i,
            'Cards must never be statically rendered with display: none'
          );
        }
      }
    });
  });
});
