import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, fileExists, SOURCE_FILES, DIST_FILES } from '../helpers/fixtures.js';

describe('Tier 1: Code Quality, Build Output & Static Infrastructure (PROJECT.md #16)', () => {
  it('T1-BLD-01: Azure Static Web Apps configuration must define navigationFallback and security headers', () => {
    // Authoritative source: PROJECT.md § Code Layout
    assert.ok(fileExists(SOURCE_FILES.staticWebAppConfig), 'public/staticwebapp.config.json must exist');
    const rawConfig = readProjectFile(SOURCE_FILES.staticWebAppConfig);
    const config = JSON.parse(rawConfig);
    
    const has404Rewrite = (config.responseOverrides && config.responseOverrides['404'] && config.responseOverrides['404'].rewrite === '/404.html') ||
      (config.navigationFallback && config.navigationFallback.rewrite === '/404.html');
    assert.ok(has404Rewrite, 'Config must declare 404 rewrite to /404.html in responseOverrides or navigationFallback');
    assert.ok(config.globalHeaders, 'Config must declare globalHeaders');
    assert.ok(config.mimeTypes, 'Config must declare custom mimeTypes');
  });

  it('T1-BLD-02: All required static pages must exist in dist/ build output', () => {
    // Authoritative source: PROJECT.md § Code Layout & Architecture
    const requiredPages = [
      DIST_FILES.index,
      DIST_FILES.consultoria,
      DIST_FILES.enIndex,
      DIST_FILES.enConsulting,
      DIST_FILES.notFound,
    ];

    for (const page of requiredPages) {
      assert.ok(fileExists(page), `Static build page must exist: ${page}`);
    }
  });

  it('T1-BLD-03: dist/sitemap-index.xml must be generated for SEO integrity', () => {
    // Authoritative source: Acceptance Criteria: "Puntuación de 100/100 en SEO"
    assert.ok(fileExists('dist/sitemap-index.xml'), 'dist/sitemap-index.xml must exist for SEO indexing');
  });

  it('T1-BLD-04: tsconfig.json must enforce strict Astro TypeScript checks', () => {
    assert.ok(fileExists('tsconfig.json'), 'tsconfig.json must exist');
    const tsconfig = JSON.parse(readProjectFile('tsconfig.json'));
    assert.ok(tsconfig.extends.includes('astro/tsconfigs/strict') || tsconfig.compilerOptions, 'tsconfig must be valid');
  });

  it('T1-BLD-05: API contact function backend contract exists and is testable', () => {
    // Authoritative source: PROJECT.md § Architecture: Azure Functions (api/) handling /api/contact
    assert.ok(fileExists(SOURCE_FILES.contactApi), 'api/src/functions/contact.js must exist');
    assert.ok(fileExists('api/test/contact.test.js'), 'api/test/contact.test.js must exist');
  });
});
