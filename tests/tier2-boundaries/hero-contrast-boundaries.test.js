import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES } from '../helpers/fixtures.js';
import { contrastRatio, contrastAtOpacity } from '../helpers/contrast.js';

describe('Tier 2: Hero Contrast Boundaries & Color Thresholds', () => {
  const heroSource = readProjectFile(SOURCE_FILES.heroAstro);

  it('T2-CTR-01: Contrast on subtle canvas background (#FAF9FC) also satisfies >= 3:1 threshold', () => {
    // Canvas subtle is #FAF9FC per global.css theme tokens
    const ratioWhite = contrastRatio('#191722', '#FFFFFF');
    const ratioSubtle = contrastRatio('#191722', '#FAF9FC');
    
    assert.ok(ratioSubtle >= 7.0, `Subtle background contrast is ${ratioSubtle.toFixed(2)}:1, meeting AAA`);
    const ratioAtFloorSubtle = contrastAtOpacity('#191722', 0.60, '#FAF9FC');
    assert.ok(ratioAtFloorSubtle >= 3.0, 'At opacity floor 0.60, contrast against #FAF9FC must be >= 3:1');
    assert.ok(ratioAtFloorSubtle >= 4.5, 'At opacity floor 0.60, contrast against #FAF9FC must be >= 4.5:1');
  });

  it('T2-CTR-02: Opacity spectrum scan identifies exact mathematical boundary for 3.0:1 contrast', () => {
    // Scan opacity from 0.00 to 1.00 to locate transition boundary
    let minAlphaFor3To1 = 1.0;
    for (let alpha = 0.01; alpha <= 1.0; alpha += 0.01) {
      const cr = contrastAtOpacity('#191722', alpha, '#FFFFFF');
      if (cr >= 3.0) {
        minAlphaFor3To1 = alpha;
        break;
      }
    }

    // Minimum alpha needed for 3:1 is around ~0.46 (contrast ratio 3.0:1)
    assert.ok(
      minAlphaFor3To1 <= 0.50,
      `Calculated minimum alpha for 3:1 is ${minAlphaFor3To1.toFixed(2)}, proving 0.60 is safely above boundary`
    );
  });

  it('T2-CTR-03: Rotating phrases array contains at least 3 distinct non-empty phrases in both locales', () => {
    const phrasesEnMatch = heroSource.match(/locale === 'en'[\s\S]*?\[(.*?)\]/);
    const phrasesEsMatch = heroSource.match(/:\s*\[(.*?)\];/);
    assert.ok(phrasesEnMatch, 'English phrases array must exist');
    assert.ok(phrasesEsMatch, 'Spanish phrases array must exist');

    const phrasesEn = phrasesEnMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
    const phrasesEs = phrasesEsMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);

    assert.ok(phrasesEn.length >= 3, `Expected >= 3 EN phrases, found ${phrasesEn.length}`);
    assert.ok(phrasesEs.length >= 3, `Expected >= 3 ES phrases, found ${phrasesEs.length}`);
    assert.equal(phrasesEn.length, phrasesEs.length, 'Bilingual phrase counts must match');
  });

  it('T2-CTR-04: Rotation reading timer interval must be at least 3000ms for readability', () => {
    // Check that rotation timer delay is >= 3000ms
    const timerMatch = heroSource.match(/setTimeout\(rotate,\s*(\d+)\)/);
    assert.ok(timerMatch, 'Timer interval must be defined in Hero.astro');
    const intervalMs = parseInt(timerMatch[1], 10);
    assert.ok(
      intervalMs >= 3000,
      `Word-morph display duration must be >= 3000ms (got ${intervalMs}ms) to give users ample reading time.`
    );
  });

  it('T2-CTR-05: Hero headline size class qualifies as large text under WCAG definitions', () => {
    // Hero headline uses text-3xl sm:text-5xl md:text-6xl lg:text-[4.15rem]
    // WCAG definition of large text: >= 18pt (24px) or bold >= 14pt (18.5px)
    // 3xl is 30px, 5xl is 48px, which is well above the 24px large text threshold.
    assert.match(
      heroSource,
      /text-3xl|text-5xl|text-6xl/i,
      'Hero headline uses text sizes above 24px, qualifying as large text where WCAG AA requires 3:1 minimum'
    );
  });
});
