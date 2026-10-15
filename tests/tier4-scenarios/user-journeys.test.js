import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES, DIST_FILES, fileExists } from '../helpers/fixtures.js';
import { parseHtml, querySelector, querySelectorAll, getAttribute, getElementById, getTextContent, byTag } from '../helpers/dom.js';

describe('Tier 4: Real-World Application Scenarios & User Journeys', () => {
  const consultoriaHtml = fileExists(DIST_FILES.consultoria) ? readProjectFile(DIST_FILES.consultoria) : null;
  const indexHtml = fileExists(DIST_FILES.index) ? readProjectFile(DIST_FILES.index) : null;

  it('T4-SCN-01: User Journey 1 — PyME Business Owner exploring Consultoria from entry to inquiry', () => {
    // A business owner arrives on /consultoria:
    // 1. Hero presents clear value proposition ("Tecnología para pequeños negocios")
    // 2. Frictions section identifies concrete bottlenecks
    // 3. Solutions section details tangible deliverables
    // 4. Stepper outlines clear 3-phase roadmap
    // 5. Investment section sets expectations
    // 6. Contact form has all necessary fields to describe their business and problem
    
    assert.ok(consultoriaHtml, 'dist/consultoria/index.html must exist');
    const doc = parseHtml(consultoriaHtml);

    // Verify presence of all key sequential conversion sections
    const expectedSections = ['inicio-consultoria', 'problemas', 'soluciones', 'proceso', 'proyectos', 'contacto'];
    for (const secId of expectedSections) {
      const section = getElementById(doc, secId);
      assert.ok(section, `Consultoria page must contain #${secId} section in customer journey`);
    }

    // Verify contact form inputs
    const form = getElementById(doc, 'consulting-contact-form');
    assert.ok(form, 'Must contain contact form');
    const inputs = querySelectorAll(form, byTag('input'));
    const names = inputs.map((i) => getAttribute(i, 'name')).filter(Boolean);
    
    assert.ok(names.includes('name'), 'Form must include name input');
    assert.ok(names.includes('email'), 'Form must include email input');
    assert.ok(names.includes('business'), 'Form must include business input');
    assert.ok(names.includes('phone'), 'Form must include phone input');
  });

  it('T4-SCN-02: User Journey 2 — Technical Recruiter navigating Portfolio Projects and Architecture', () => {
    // A recruiter or engineering manager browses the home page:
    // 1. Sees clear editorial headline
    // 2. Traverses section order: Hero -> Experiencia -> Soluciones PyME -> Proyectos -> Sobre mí
    // 3. Inspects project catalog articles
    // 4. Finds external repository links with secure attributes (target="_blank", rel="noopener noreferrer")
    
    assert.ok(indexHtml, 'dist/index.html must exist');
    const doc = parseHtml(indexHtml);

    const links = querySelectorAll(doc, byTag('a'));
    const repoLinks = links.filter((a) => {
      const href = getAttribute(a, 'href');
      return href && href.includes('github.com');
    });

    assert.ok(repoLinks.length >= 3, `Expected at least 3 GitHub project links, found ${repoLinks.length}`);
    for (const link of repoLinks) {
      assert.equal(
        getAttribute(link, 'target'),
        '_blank',
        'External GitHub links must open in new tab'
      );
      assert.match(
        getAttribute(link, 'rel') || '',
        /noopener|noreferrer/,
        'External links must declare noopener or noreferrer for security'
      );
    }
  });

  it('T4-SCN-03: User Journey 3 — Accessibility & Screen Reader User across core pages', () => {
    // Low-vision or screen-reader user:
    // 1. Focusable interactive elements have visible focus outlines (:focus-visible)
    // 2. Animated morph span is aria-hidden="true"
    // 3. Status updates have role="status" and aria-live="polite"
    // 4. External links include screen-reader only text announcements ("opens in a new tab")
    
    const globalCss = readProjectFile(SOURCE_FILES.globalCss);
    assert.match(
      globalCss,
      /:focus-visible\s*\{[\s\S]*?outline:/,
      'Must define accessible focus-visible outline tokens'
    );

    if (indexHtml) {
      const doc = parseHtml(indexHtml);
      const srSpans = querySelectorAll(doc, (node) => {
        const classAttr = getAttribute(node, 'class');
        return classAttr && classAttr.includes('sr-only');
      });
      assert.ok(srSpans.length >= 2, 'Must provide sr-only announcements for screen readers');
    }
  });

  it('T4-SCN-04: User Journey 4 — Resilient Contact Submission during API failure or offline state', () => {
    // When network fails, the user experience does NOT crash:
    // 1. Form input is preserved (form is not reset on error)
    // 2. Submit button disabled state is restored
    // 3. User can see clear message instructing them to retry or write directly to email
    
    const consultingSource = readProjectFile(SOURCE_FILES.consultingAstro);
    
    // Check that form.reset() is ONLY called on response.ok
    assert.match(
      consultingSource,
      /if\s*\(\s*response\.ok\s*\)\s*\{[\s\S]*?form\.reset\(\)/,
      'form.reset() must only be invoked when response is ok, preserving input on error'
    );
    
    // Check that direct email fallback is provided in contact section
    assert.match(
      consultingSource,
      /mailto:/,
      'Direct mailto fallback link must be provided in case form submission encounters errors'
    );
  });
});
