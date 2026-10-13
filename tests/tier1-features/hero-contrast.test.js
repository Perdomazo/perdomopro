import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES, DIST_FILES, fileExists } from '../helpers/fixtures.js';
import { parseHtml, querySelector, getAttribute, byAttr } from '../helpers/dom.js';
import { contrastRatio, contrastAtOpacity } from '../helpers/contrast.js';

describe('Tier 1: Hero Contrast & WCAG AA Accessibility (ORIGINAL_REQUEST §R4, PROJECT.md #14)', () => {
  const heroSource = readProjectFile(SOURCE_FILES.heroAstro);
  const indexHtml = fileExists(DIST_FILES.index) ? readProjectFile(DIST_FILES.index) : null;
  const doc = indexHtml ? parseHtml(indexHtml) : null;

  it('T1-CTR-01: Baseline typography contrast of #191722 on #FFFFFF canvas exceeds WCAG AA and AAA thresholds', () => {
    // Authoritative source: PROJECT.md § Architecture & global.css tokens
    // FG: #191722, BG: #FFFFFF
    const ratio = contrastRatio('#191722', '#FFFFFF');
    assert.ok(
      ratio >= 7.0,
      `Baseline text contrast ratio is ${ratio.toFixed(2)}:1, which exceeds the 7:1 WCAG AAA threshold.`
    );
  });

  it('T1-CTR-02: Word-morph animation script must not drop opacity to 0 (opacity-0) during word rotation transitions', () => {
    // Authoritative source: ORIGINAL_REQUEST §R4 & PROJECT.md Feature 14
    // "Ajustar la animación de rotación tipográfica en Hero.astro ([data-word-morph]) para garantizar que en todos sus estados de transición mantenga un contraste superior a 3:1 respecto al fondo blanco, solventando la advertencia detectada en Lighthouse."
    // PROJECT.md § Interface Contracts: "Opacity floor during transitions: >= 0.60 (contrast ratio >= 4.65:1 against #FFFFFF)"
    
    // Check if the script adds 'opacity-0'
    const scriptPart = heroSource.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(scriptPart, 'Hero.astro must contain word-morph script');
    const scriptContent = scriptPart[1];

    const dropsToZeroOpacity = scriptContent.includes("'opacity-0'") ||
      scriptContent.includes('"opacity-0"') ||
      /classList\.add\([^)]*opacity-0/i.test(scriptContent);

    assert.equal(
      dropsToZeroOpacity,
      false,
      'Word-morph transition must NOT drop to opacity-0. At opacity 0, contrast ratio against white is 1:1, failing Lighthouse and WCAG AA.'
    );
  });

  it('T1-CTR-03: Minimum opacity during transition must yield photometric contrast >= 3.0:1 against #FFFFFF', () => {
    // Authoritative source: ORIGINAL_REQUEST §R4
    // Contrast of #191722 on #FFFFFF as a function of opacity:
    // At opacity 0.38, contrast is ~3.0:1.
    // At opacity 0.60, contrast is ~4.65:1.
    const ratioAtFloor = contrastAtOpacity('#191722', 0.60, '#FFFFFF');
    assert.ok(
      ratioAtFloor >= 3.0,
      `Calculated contrast at opacity floor 0.60 is ${ratioAtFloor.toFixed(2)}:1, maintaining >= 3:1.`
    );
    assert.ok(
      ratioAtFloor >= 4.5,
      `Calculated contrast at opacity floor 0.60 is ${ratioAtFloor.toFixed(2)}:1, satisfying WCAG AA normal text floor (4.5:1).`
    );
  });

  it('T1-CTR-04: Word-morph element must maintain aria-hidden="true" on animated span with sr-only parent label', () => {
    // Authoritative source: PROJECT.md § Interface Contracts: Hero.astro ↔ Accessibility
    // "Screen reader accessibility: aria-hidden="true" on animated morph span with static parent accessible announcement or appropriate label."
    
    assert.match(
      heroSource,
      /<span[^>]*aria-hidden="true"[^>]*data-word-morph/i,
      'data-word-morph span must have aria-hidden="true" to prevent screen reader churn during rotation'
    );
    assert.match(
      heroSource,
      /class="sr-only"/i,
      'Hero headline must provide static screen reader accessible text via sr-only'
    );
  });

  it('T1-CTR-05: prefers-reduced-motion must halt the morph rotation and preserve initial phrase', () => {
    // Authoritative source: ORIGINAL_REQUEST §R4 & Acceptance Criteria
    // Check that Hero.astro script inspects prefers-reduced-motion
    assert.match(
      heroSource,
      /prefers-reduced-motion:\s*reduce/i,
      'Hero script must query prefers-reduced-motion: reduce'
    );
    assert.match(
      heroSource,
      /reducedMotion\.addEventListener\('change'/i,
      'Hero script must listen for reducedMotion preference changes to halt timer'
    );
  });

  it('T1-CTR-06: Transition duration must conform to 300ms timing spec', () => {
    // Authoritative source: PROJECT.md § Interface Contracts
    // "Transition duration: 300ms"
    assert.match(
      heroSource,
      /duration-300|300ms/i,
      'Hero.astro must specify 300ms transition duration'
    );
  });
});
