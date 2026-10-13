import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES, DIST_FILES, fileExists } from '../helpers/fixtures.js';
import { parseHtml, querySelector, querySelectorAll, getAttribute, getElementById, byTag } from '../helpers/dom.js';

describe('Tier 3: Pairwise Cross-Feature Interactions', () => {
  const motionSource = readProjectFile(SOURCE_FILES.motion);
  const heroSource = readProjectFile(SOURCE_FILES.heroAstro);
  const consultingSource = readProjectFile(SOURCE_FILES.consultingAstro);
  const projectsAstro = readProjectFile(SOURCE_FILES.projectsAstro);

  it('T3-INT-01: Interaction between Lenis Smooth Scroll and Project Image Loading: fixed aspect ratios prevent scroll jump', () => {
    // When Lenis drives scroll position, unconstrained image loads cause scroll-jumps.
    // Verifies project cards provide aspect-[16/8] or aspect-[16/9] on image wrapper.
    assert.match(
      projectsAstro,
      /aspect-\[16\/(?:8|9)\]/,
      'Image container must define explicit aspect ratio to prevent CLS during Lenis scroll'
    );
  });

  it('T3-INT-02: Interaction between Prefers-Reduced-Motion and Corner Wash: static pinning with zero tweens', () => {
    // In motion.ts, if prefersReducedMotion is true:
    // lights stay in the upper corners, opacity 1, no tweens, no scroll travel.
    assert.match(
      motionSource,
      /if\s*\(\s*prefersReducedMotion\s*\)\s*\{[\s\S]*?WASH_SIDES\.forEach\(\(side\)\s*=>\s*gsap\.set\(lights\[side\]\.corner,\s*\{\s*opacity:\s*1\s*\}\)\);[\s\S]*?return;/,
      'Corner wash must short-circuit to static state when prefersReducedMotion is detected'
    );
  });

  it('T3-INT-03: Interaction between Hero Word Morph and Reduced Motion: dynamic listener safely halts timers', () => {
    // In Hero.astro, dynamic reducedMotion listener ensures that switching OS preference
    // mid-session immediately stops the rotation and restores the initial phrase.
    assert.match(
      heroSource,
      /reducedMotion\.addEventListener\('change'[\s\S]*?clearTimeout\(timer\)[\s\S]*?textContent\s*=\s*phrases\[0\]/,
      'Reduced motion toggle must clear timeout and reset headline text to initial phrase'
    );
  });

  it('T3-INT-04: Interaction between Consultoria Stepper and Viewport: responsive layout classes adapt orientation', () => {
    // Check that stepper supports responsive grid: desktop md:grid-cols-3 or sm:grid-cols-3
    assert.match(
      consultingSource,
      /grid\s+(?:sm|md|lg):grid-cols-/i,
      'Process flow must support responsive column grid adapting from single column on mobile to multi-column on desktop'
    );
  });

  it('T3-INT-05: Interaction between Form Submission Status and DOM Reveal items: status preserves layout height', () => {
    // Status message #consulting-form-status has min-h-5 to prevent layout shifting when status text appears
    assert.match(
      consultingSource,
      /id="consulting-form-status"[^>]*min-h-/i,
      'Status element must reserve minimum height (min-h-5) to avoid CLS when feedback appears'
    );
  });

  it('T3-INT-06: Interaction between Bilingual Routing and Data Content: symmetrical data availability', () => {
    const projectsData = readProjectFile(SOURCE_FILES.projectsData);
    assert.ok(projectsData.includes("'es-MX'"), 'Must contain es-MX data content');
    assert.ok(projectsData.includes('en:'), 'Must contain en data content');

    // If dist files exist, check route symmetry
    if (fileExists(DIST_FILES.index) && fileExists(DIST_FILES.enIndex)) {
      const esDoc = parseHtml(readProjectFile(DIST_FILES.index));
      const enDoc = parseHtml(readProjectFile(DIST_FILES.enIndex));

      const esSections = querySelectorAll(esDoc, byTag('section'));
      const enSections = querySelectorAll(enDoc, byTag('section'));
      assert.equal(
        esSections.length,
        enSections.length,
        'Home pages in Spanish and English must have identical section counts'
      );
    }
  });
});
