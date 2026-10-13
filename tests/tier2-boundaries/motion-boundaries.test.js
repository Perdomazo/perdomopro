import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES } from '../helpers/fixtures.js';

describe('Tier 2: Motion Boundaries & Corner Cases', () => {
  const motionSource = readProjectFile(SOURCE_FILES.motion);
  const globalCss = readProjectFile(SOURCE_FILES.globalCss);

  it('T2-MOT-01: Corner wash layer must have strict containment to prevent layout thrashing on resize', () => {
    // Authoritative source: PROJECT.md § motion.ts corner wash architecture
    // contain:layout paint style, pointer-events:none, overflow:hidden
    assert.match(
      motionSource,
      /contain:\s*layout paint style/i,
      'Corner wash container must declare contain:layout paint style to isolate rendering boundaries'
    );
    assert.match(
      motionSource,
      /pointer-events:\s*none/i,
      'Corner wash container must declare pointer-events:none so it never intercepts user clicks'
    );
    assert.match(
      motionSource,
      /overflow:\s*hidden/i,
      'Corner wash container must declare overflow:hidden to avoid horizontal scrollbar expansion'
    );
  });

  it('T2-MOT-02: Repeated cleanupMotion calls must be safe and idempotent', () => {
    // Verify that cleanupMotion checks if instances exist before calling methods
    assert.match(
      motionSource,
      /if\s*\(\s*gsapMatchMediaInstance\s*\)\s*\{[\s\S]*?gsapMatchMediaInstance\s*=\s*null;/,
      'cleanupMotion must nullify gsapMatchMediaInstance'
    );
    assert.match(
      motionSource,
      /if\s*\(\s*lenisInstance\s*\)\s*\{[\s\S]*?lenisInstance\s*=\s*null;/,
      'cleanupMotion must nullify lenisInstance'
    );
    assert.match(
      motionSource,
      /if\s*\(\s*washContext\s*\)\s*\{[\s\S]*?washContext\s*=\s*null;/,
      'cleanupMotion must nullify washContext'
    );
  });

  it('T2-MOT-03: Motion queries must handle mobile and desktop breakpoint boundaries at exactly 1023px vs 1024px', () => {
    // Breakpoint boundary test: min-width: 1024px vs max-width: 1023px
    assert.match(
      motionSource,
      /\(min-width:\s*1024px\)/,
      'Desktop condition must bind to min-width: 1024px'
    );
    assert.match(
      motionSource,
      /\(max-width:\s*1023px\)/,
      'Mobile condition must bind to max-width: 1023px'
    );
  });

  it('T2-MOT-04: Anchor link smooth scrolling handles malformed, hash-only, and external href attributes gracefully', () => {
    // Checks that clickListener safely handles null target, href without hash, and empty hash
    assert.match(
      motionSource,
      /if\s*\(!target\)\s*return;/,
      'clickListener must guard against null target'
    );
    assert.match(
      motionSource,
      /if\s*\(!href\)\s*return;/,
      'clickListener must guard against missing href'
    );
    assert.match(
      motionSource,
      /if\s*\(hashIndex\s*===\s*-1\)\s*return;/,
      'clickListener must ignore non-hash links'
    );
  });

  it('T2-MOT-05: Section reveals gracefully handle missing elements without throwing null pointer errors', () => {
    // Sections like #sobre-mi, #recorrido, #areas, #proyectos, #proceso must check if element exists before calling gsap.from
    assert.match(
      motionSource,
      /if\s*\(\s*aboutSection\s*\)/,
      'About section must guard against null element'
    );
    assert.match(
      motionSource,
      /if\s*\(\s*processSection\s*\)/,
      'Process section must guard against null element'
    );
    assert.match(
      motionSource,
      /if\s*\(\s*projectsSection\s*\)/,
      'Projects section must guard against null element'
    );
  });
});
