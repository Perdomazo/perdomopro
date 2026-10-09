import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES, fileExists } from '../helpers/fixtures.js';

describe('Tier 2: Projects Media & Data Boundaries', () => {
  const projectsDataRaw = readProjectFile(SOURCE_FILES.projectsData);

  it('T2-PRJ-01: Project numbers must follow strictly ordered, two-digit zero-padded sequence (01, 02, ...)', () => {
    const numberMatches = [...projectsDataRaw.matchAll(/number:\s*'(\d+)'/g)].map((m) => m[1]);
    assert.ok(numberMatches.length >= 5, 'Must contain at least 5 projects');
    for (let i = 0; i < numberMatches.length; i++) {
      const expected = String(i + 1).padStart(2, '0');
      assert.equal(numberMatches[i], expected, `Project at index ${i} must have number "${expected}"`);
    }
  });

  it('T2-PRJ-02: All external repository and live links must be HTTPS and non-empty', () => {
    const hrefMatches = [...projectsDataRaw.matchAll(/(?:href|liveHref):\s*'([^']+)'/g)].map((m) => m[1]);
    assert.ok(hrefMatches.length >= 5, 'Must contain project link hrefs');
    for (const href of hrefMatches) {
      assert.ok(
        href.startsWith('https://'),
        `Link "${href}" must use secure HTTPS protocol`
      );
    }
  });

  it('T2-PRJ-03: Every project must declare at least 2 distinct technologies', () => {
    const techMatches = [...projectsDataRaw.matchAll(/technologies:\s*\[([^\]]+)\]/g)];
    assert.ok(techMatches.length >= 5, 'Must find technologies arrays for all projects');
    for (const match of techMatches) {
      const techs = match[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
      assert.ok(
        techs.length >= 2,
        `Technologies list must have >= 2 items, got ${techs.length}: ${JSON.stringify(techs)}`
      );
    }
  });

  it('T2-PRJ-04: Project classification must belong to the allowed type domain', () => {
    const allowed = ['personal', 'academic', 'laboratory', 'personal-site', 'software-project'];
    const classMatches = [...projectsDataRaw.matchAll(/classification:\s*'([^']+)'/g)].map((m) => m[1]);
    for (const cls of classMatches) {
      assert.ok(
        allowed.includes(cls),
        `Classification "${cls}" is not in the allowed domain: ${allowed.join(', ')}`
      );
    }
  });

  it('T2-PRJ-05: SVG vector assets when present must have valid SVG root tag and scalable viewBox', () => {
    const svgPaths = [
      'public/images/projects/gadgetstock-swagger.svg',
      'public/images/projects/etf-portfolio-analytics.svg',
      'public/images/projects/adrian-quant-lab.svg',
    ];

    for (const p of svgPaths) {
      if (fileExists(p)) {
        const content = readProjectFile(p);
        assert.match(content, /<svg[^>]*viewBox=/i, `${p} must specify a viewBox for responsive scalability`);
        assert.match(content, /<\/svg>/i, `${p} must have closing </svg> tag`);
      }
    }
  });
});
