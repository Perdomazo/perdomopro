import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES } from '../helpers/fixtures.js';

describe('Tier 1: Motion Stabilization & Flickering Elimination (ORIGINAL_REQUEST §R1, PROJECT.md #1-4)', () => {
  const motionSource = readProjectFile(SOURCE_FILES.motion);
  const globalCss = readProjectFile(SOURCE_FILES.globalCss);
  const processAstro = readProjectFile(SOURCE_FILES.processAstro);

  it('T1-MOT-01: motion.ts must not contain filter blur exit animations on text candidates', () => {
    // Authoritative source: ORIGINAL_REQUEST §R1 & PROJECT.md Feature 1
    // "Modificar src/scripts/motion.ts para eliminar la animación de salida basada en filter: blur(...) y opacity en exitCandidates"
    const hasExitBlur = /filter:\s*['"]blur\([^'"]+\)['"]/i.test(motionSource);
    assert.equal(
      hasExitBlur,
      false,
      'Found filter: blur(...) exit animation in src/scripts/motion.ts. Blur on scroll causes font antialiasing and ClearType shifts.'
    );
  });

  it('T1-MOT-02: motion.ts exit animations must not scrub opacity on text/semantic blocks', () => {
    // Authoritative source: ORIGINAL_REQUEST §R1
    // "eliminar la animación de salida basada en filter: blur(...) y opacity en exitCandidates sobre elementos de texto (p, header, article, li, etc.)"
    const hasExitOpacityScrub = /exitGroups\.forEach\([\s\S]*?opacity\(/i.test(motionSource) ||
      /exitCandidates[\s\S]*?filter:\s*['"][^'"]*opacity/i.test(motionSource);
    assert.equal(
      hasExitOpacityScrub,
      false,
      'Exit candidates in motion.ts must not scrub opacity on leaving viewport.'
    );
  });

  it('T1-MOT-03: global.css .consulting-reveal must not declare filter blur or transition: filter', () => {
    // Authoritative source: PROJECT.md Feature 2 & ORIGINAL_REQUEST §R1
    // "Remove colliding transition: filter and transition: opacity in global.css (.consulting-reveal)"
    const consultingRevealMatch = globalCss.match(/\.consulting-reveal\s*\{([^}]+)\}/);
    assert.ok(consultingRevealMatch, '.consulting-reveal rule must exist in global.css');
    const ruleBody = consultingRevealMatch[1];
    
    const hasFilterTransition = /transition:[^;]*filter/i.test(ruleBody) || /filter:\s*blur/i.test(ruleBody);
    assert.equal(
      hasFilterTransition,
      false,
      '.consulting-reveal must not apply filter: blur or transition on filter due to GPU rendering collision with GSAP.'
    );
  });

  it('T1-MOT-04: Process.astro progress bar must not declare transition-transform colliding with GSAP scaleX scrub', () => {
    // Authoritative source: PROJECT.md Feature 2
    // "Remove colliding transition-transform in Process.astro"
    const hasCollidingTransition = /data-process-progress[\s\S]*?transition-transform/i.test(processAstro) ||
      /class="[^"]*transition-transform[^"]*"[^>]*data-process-progress/i.test(processAstro);
    assert.equal(
      hasCollidingTransition,
      false,
      '[data-process-progress] in Process.astro must not declare transition-transform which fights GSAP scrub tick rate.'
    );
  });

  it('T1-MOT-05: motion.ts section reveals must use hardware-accelerated transforms and once: true', () => {
    // Authoritative source: ORIGINAL_REQUEST §R1
    // "Asegurar que las animaciones de revelado utilicen transformaciones aceleradas por hardware (opacity, transform: translateY) con activación única (once: true)"
    const hasScrollTriggerReveals = /ScrollTrigger/i.test(motionSource);
    assert.ok(hasScrollTriggerReveals, 'motion.ts must use ScrollTrigger for section reveals');
    
    // Look for once: true in ScrollTrigger configurations
    const onceMatches = motionSource.match(/once:\s*true/g);
    assert.ok(
      onceMatches && onceMatches.length >= 3,
      `Expected at least 3 reveals configured with once: true, found ${onceMatches ? onceMatches.length : 0}`
    );
  });

  it('T1-MOT-06: prefers-reduced-motion: reduce must disable smooth scroll and scrub animations', () => {
    // Authoritative source: ORIGINAL_REQUEST §R1 & Acceptance Criteria
    // "En modo prefers-reduced-motion: reduce, todos los contenidos permanecen inmediatamente visibles sin transiciones."
    assert.match(
      motionSource,
      /prefers-reduced-motion:\s*reduce/i,
      'motion.ts must query prefers-reduced-motion: reduce'
    );
    assert.match(
      globalCss,
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/i,
      'global.css must provide @media (prefers-reduced-motion: reduce) block'
    );
    
    // In global.css, transition-duration and animation-duration should be neutralized
    const reducedBlock = globalCss.match(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(reducedBlock, 'Must contain prefers-reduced-motion media query body');
    assert.match(
      reducedBlock[1],
      /transition-duration:\s*0\.01ms\s*!important/i,
      'Reduced motion must force transition-duration: 0.01ms !important'
    );
  });

  it('T1-MOT-07: cleanupMotion must cleanly revert instances and remove event listeners for idempotence', () => {
    // Authoritative source: PROJECT.md Feature 1 & scripts/motion.ts
    assert.match(motionSource, /export function cleanupMotion\(\)/, 'cleanupMotion must be exported');
    assert.match(motionSource, /ScrollTrigger\.getAll\(\)\.forEach/, 'cleanupMotion must kill all ScrollTriggers');
    assert.match(motionSource, /gsap\.ticker\.remove/, 'cleanupMotion must detach ticker listener');
  });
});
