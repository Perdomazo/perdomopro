import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, DIST_FILES, fileExists } from '../helpers/fixtures.js';
import {
  parseHtml,
  querySelector,
  querySelectorAll,
  getAttribute,
  hasAttribute,
  getClasses,
  getElementById,
  getTextContent,
  byAttr,
  byTag,
  walk,
} from '../helpers/dom.js';

describe('Tier 5 Adversarial: Bilingual Parity & DOM Integrity Challenge (M2-2)', () => {
  const consultoriaPath = DIST_FILES.consultoria;
  const enConsultingPath = DIST_FILES.enConsulting;

  assert.ok(fileExists(consultoriaPath), `${consultoriaPath} must exist`);
  assert.ok(fileExists(enConsultingPath), `${enConsultingPath} must exist`);

  const esHtml = readProjectFile(consultoriaPath);
  const enHtml = readProjectFile(enConsultingPath);

  const docEs = parseHtml(esHtml);
  const docEn = parseHtml(enHtml);

  // Helper to extract consulting page root
  function getConsultingRoot(doc) {
    return querySelector(doc, byAttr('data-consulting-page'));
  }

  const rootEs = getConsultingRoot(docEs);
  const rootEn = getConsultingRoot(docEn);

  it('BP-01: Both consulting pages must have root container [data-consulting-page]', () => {
    assert.ok(rootEs, 'Spanish page must contain [data-consulting-page]');
    assert.ok(rootEn, 'English page must contain [data-consulting-page]');
  });

  it('BP-02: Motion hooks parity - exact 1:1 match of data-scroll-module containers', () => {
    const modulesEs = querySelectorAll(rootEs, byAttr('data-scroll-module'));
    const modulesEn = querySelectorAll(rootEn, byAttr('data-scroll-module'));

    assert.equal(
      modulesEs.length,
      modulesEn.length,
      `Number of data-scroll-module containers must match: ES=${modulesEs.length}, EN=${modulesEn.length}`
    );

    // Verify each scroll module has matching tag and matching ID if an ID is present
    for (let i = 0; i < modulesEs.length; i++) {
      const elEs = modulesEs[i];
      const elEn = modulesEn[i];
      assert.equal(
        elEs.tagName,
        elEn.tagName,
        `Scroll module #${i} tag mismatch: ES=<${elEs.tagName}> vs EN=<${elEn.tagName}>`
      );

      const idEs = getAttribute(elEs, 'id');
      const idEn = getAttribute(elEn, 'id');
      assert.equal(
        idEs,
        idEn,
        `Scroll module #${i} ID mismatch: ES="${idEs}" vs EN="${idEn}"`
      );
    }
  });

  it('BP-03: Motion hooks parity - exact 1:1 count and hierarchy match of data-reveal-item elements', () => {
    const revealsEs = querySelectorAll(rootEs, byAttr('data-reveal-item'));
    const revealsEn = querySelectorAll(rootEn, byAttr('data-reveal-item'));

    assert.equal(
      revealsEs.length,
      revealsEn.length,
      `Total count of data-reveal-item elements must match: ES=${revealsEs.length}, EN=${revealsEn.length}`
    );

    // Verify tag type and structural sequence of every reveal item
    for (let i = 0; i < revealsEs.length; i++) {
      const elEs = revealsEs[i];
      const elEn = revealsEn[i];
      assert.equal(
        elEs.tagName,
        elEn.tagName,
        `Reveal item #${i} tag mismatch: ES=<${elEs.tagName}> vs EN=<${elEn.tagName}>`
      );

      // Check classes match (layout classes must be identical)
      const classesEs = getClasses(elEs).sort();
      const classesEn = getClasses(elEn).sort();
      assert.deepEqual(
        classesEs,
        classesEn,
        `Reveal item #${i} (<${elEs.tagName}>) CSS class mismatch: ES=${classesEs.join(' ')} vs EN=${classesEn.join(' ')}`
      );
    }
  });

  it('BP-04: Section structure & ID symmetry across all 9 numbered sections', () => {
    const expectedSections = [
      { id: 'inicio-consultoria', tag: 'section' },
      { id: 'problemas', tag: 'section' },
      { id: 'soluciones', tag: 'section' },
      { id: 'proceso', tag: 'section' },
      { id: 'proyectos', tag: 'section' },
      { id: null, tag: 'section' }, // 05 // Cloud
      { id: null, tag: 'section' }, // 06 // Fit
      { id: 'inversion', tag: 'section' }, // 07 // Inversion
      { id: 'faq', tag: 'section' }, // 08 // FAQ
      { id: 'contacto', tag: 'section' }, // 09 // Contacto
    ];

    const sectionsEs = querySelectorAll(rootEs, byTag('section'));
    const sectionsEn = querySelectorAll(rootEn, byTag('section'));

    assert.equal(sectionsEs.length, expectedSections.length, `ES sections count (${sectionsEs.length}) should match expected`);
    assert.equal(sectionsEn.length, expectedSections.length, `EN sections count (${sectionsEn.length}) should match expected`);

    expectedSections.forEach(({ id }) => {
      if (id) {
        const secEs = getElementById(rootEs, id);
        const secEn = getElementById(rootEn, id);
        assert.ok(secEs, `ES page must have section #${id}`);
        assert.ok(secEn, `EN page must have section #${id}`);
      }
    });
  });

  it('BP-05: Problems/Frictions section (#problemas) structural symmetry & card counts', () => {
    const secEs = getElementById(rootEs, 'problemas');
    const secEn = getElementById(rootEn, 'problemas');

    const articlesEs = querySelectorAll(secEs, byTag('article'));
    const articlesEn = querySelectorAll(secEn, byTag('article'));

    assert.equal(articlesEs.length, 6, 'ES must have exactly 6 problem articles');
    assert.equal(articlesEn.length, 6, 'EN must have exactly 6 problem articles');

    for (let i = 0; i < 6; i++) {
      const artEs = articlesEs[i];
      const artEn = articlesEn[i];

      // Each article must have h3
      const h3Es = querySelector(artEs, byTag('h3'));
      const h3En = querySelector(artEn, byTag('h3'));
      assert.ok(h3Es && getTextContent(h3Es).trim().length > 0, `ES problem ${i + 1} h3 must not be empty`);
      assert.ok(h3En && getTextContent(h3En).trim().length > 0, `EN problem ${i + 1} h3 must not be empty`);

      // Micro-badge with friction tag
      const textEs = getTextContent(artEs);
      const textEn = getTextContent(artEn);

      assert.ok(textEs.includes('Cuello de botella:'), `ES problem ${i + 1} must have 'Cuello de botella:' indicator`);
      assert.ok(textEn.includes('Bottleneck:'), `EN problem ${i + 1} must have 'Bottleneck:' indicator`);
      assert.ok(textEs.includes(`0${i + 1} / FRICCIÓN`), `ES problem ${i + 1} must have index tag`);
      assert.ok(textEn.includes(`0${i + 1} / FRICTION`), `EN problem ${i + 1} must have index tag`);
    }
  });

  it('BP-06: Solutions section (#soluciones) structural symmetry, 1+4 grid & deliverable lists', () => {
    const secEs = getElementById(rootEs, 'soluciones');
    const secEn = getElementById(rootEn, 'soluciones');

    const articlesEs = querySelectorAll(secEs, byTag('article'));
    const articlesEn = querySelectorAll(secEn, byTag('article'));

    assert.equal(articlesEs.length, 5, 'ES must have 5 solution articles');
    assert.equal(articlesEn.length, 5, 'EN must have 5 solution articles');

    // 1st article is featured (sm:col-span-2)
    assert.ok(getClasses(articlesEs[0]).includes('sm:col-span-2'), 'ES solution 1 must be featured (sm:col-span-2)');
    assert.ok(getClasses(articlesEn[0]).includes('sm:col-span-2'), 'EN solution 1 must be featured (sm:col-span-2)');

    for (let i = 0; i < 5; i++) {
      const artEs = articlesEs[i];
      const artEn = articlesEn[i];

      const ulsEs = querySelectorAll(artEs, byTag('ul'));
      const ulsEn = querySelectorAll(artEn, byTag('ul'));
      assert.equal(ulsEs.length, 1, `ES solution ${i + 1} must have deliverables <ul>`);
      assert.equal(ulsEn.length, 1, `EN solution ${i + 1} must have deliverables <ul>`);

      const lisEs = querySelectorAll(ulsEs[0], byTag('li'));
      const lisEn = querySelectorAll(ulsEn[0], byTag('li'));
      assert.equal(lisEs.length, 4, `ES solution ${i + 1} must have 4 deliverable items`);
      assert.equal(lisEn.length, 4, `EN solution ${i + 1} must have 4 deliverable items`);

      // SVG checkmarks in every li
      lisEs.forEach((li) => {
        assert.ok(querySelector(li, byTag('svg')), 'ES deliverable li must contain svg icon');
      });
      lisEn.forEach((li) => {
        assert.ok(querySelector(li, byTag('svg')), 'EN deliverable li must contain svg icon');
      });

      // Use case footer
      const textEs = getTextContent(artEs);
      const textEn = getTextContent(artEn);
      assert.ok(textEs.includes('Ideal para:'), `ES solution ${i + 1} must have 'Ideal para:'`);
      assert.ok(textEn.includes('Best for:'), `EN solution ${i + 1} must have 'Best for:'`);
    }
  });

  it('BP-07: Process section (#proceso) stepper list symmetry & deliverable footnotes', () => {
    const secEs = getElementById(rootEs, 'proceso');
    const secEn = getElementById(rootEn, 'proceso');

    const olEs = querySelector(secEs, byTag('ol'));
    const olEn = querySelector(secEn, byTag('ol'));

    const lisEs = querySelectorAll(olEs, byTag('li'));
    const lisEn = querySelectorAll(olEn, byTag('li'));

    assert.equal(lisEs.length, 3, 'ES stepper must have 3 steps');
    assert.equal(lisEn.length, 3, 'EN stepper must have 3 steps');

    for (let i = 0; i < 3; i++) {
      const textEs = getTextContent(lisEs[i]);
      const textEn = getTextContent(lisEn[i]);

      assert.ok(textEs.includes(`0${i + 1}`), `ES step ${i + 1} must show node number`);
      assert.ok(textEn.includes(`0${i + 1}`), `EN step ${i + 1} must show node number`);
      assert.ok(textEs.includes('ENTREGABLE CLAVE'), `ES step ${i + 1} must have ENTREGABLE CLAVE`);
      assert.ok(textEn.includes('KEY DELIVERABLE'), `EN step ${i + 1} must have KEY DELIVERABLE`);
      assert.ok(textEs.includes('↳'), `ES step ${i + 1} must have checkpoint indicator`);
      assert.ok(textEn.includes('↳'), `EN step ${i + 1} must have checkpoint indicator`);
    }
  });

  it('BP-08: Investment section (#inversion) tier cards & cloud sovereignty points parity', () => {
    const secEs = getElementById(rootEs, 'inversion');
    const secEn = getElementById(rootEn, 'inversion');

    const articlesEs = querySelectorAll(secEs, byTag('article'));
    const articlesEn = querySelectorAll(secEn, byTag('article'));

    assert.equal(articlesEs.length, 3, 'ES investment must have 3 tier articles');
    assert.equal(articlesEn.length, 3, 'EN investment must have 3 tier articles');

    for (let i = 0; i < 3; i++) {
      const artEs = articlesEs[i];
      const artEn = articlesEn[i];

      const lisEs = querySelectorAll(artEs, byTag('li'));
      const lisEn = querySelectorAll(artEn, byTag('li'));
      assert.equal(lisEs.length, 4, `ES tier ${i + 1} must have 4 inclusion items`);
      assert.equal(lisEn.length, 4, `EN tier ${i + 1} must have 4 inclusion items`);

      const textEs = getTextContent(artEs);
      const textEn = getTextContent(artEn);
      assert.ok(textEs.includes('IDEAL PARA:'), `ES tier ${i + 1} must have 'IDEAL PARA:'`);
      assert.ok(textEn.includes('IDEAL FIT:'), `EN tier ${i + 1} must have 'IDEAL FIT:'`);
    }

    // Cloud Sovereignty points
    const csEs = getTextContent(secEs);
    const csEn = getTextContent(secEn);
    assert.ok(csEs.includes('TRANSPARENCIA & SOBERANÍA CLOUD'), 'ES must include cloud sovereignty badge');
    assert.ok(csEn.includes('TRANSPARENCY & CLOUD SOVEREIGNTY'), 'EN must include cloud sovereignty badge');
  });

  it('BP-09: Contact Form (#consulting-contact-form) field symmetry, schemas, and live feedback region', () => {
    const formEs = getElementById(rootEs, 'consulting-contact-form');
    const formEn = getElementById(rootEn, 'consulting-contact-form');

    assert.ok(formEs, 'ES page must have form #consulting-contact-form');
    assert.ok(formEn, 'EN page must have form #consulting-contact-form');

    // Locale attribute
    assert.equal(getAttribute(formEs, 'data-locale'), 'es-MX');
    assert.equal(getAttribute(formEn, 'data-locale'), 'en');

    // Dataset messages
    const requiredDataAttrs = [
      'data-form-error',
      'data-form-loading',
      'data-form-success',
      'data-form-failure',
      'data-form-network-error',
    ];
    for (const attr of requiredDataAttrs) {
      const valEs = getAttribute(formEs, attr);
      const valEn = getAttribute(formEn, attr);
      assert.ok(valEs && valEs.length > 5, `ES form must have non-empty ${attr}`);
      assert.ok(valEn && valEn.length > 5, `EN form must have non-empty ${attr}`);
      assert.notEqual(valEs, valEn, `${attr} must be localized differently between ES and EN`);
    }

    // Fields check: name, email, business, phone, problem (textarea), website (honeypot), preferred (radios)
    const inputsEs = querySelectorAll(formEs, byTag('input')).map((n) => getAttribute(n, 'name')).filter(Boolean);
    const inputsEn = querySelectorAll(formEn, byTag('input')).map((n) => getAttribute(n, 'name')).filter(Boolean);

    assert.deepEqual(inputsEs.sort(), inputsEn.sort(), 'Input field names must match between ES and EN forms');
    assert.ok(inputsEs.includes('website'), 'Form must have honeypot website input');
    assert.ok(inputsEs.includes('name'), 'Form must have name input');
    assert.ok(inputsEs.includes('email'), 'Form must have email input');

    // Status region
    const statusEs = getElementById(formEs, 'consulting-form-status');
    const statusEn = getElementById(formEn, 'consulting-form-status');
    assert.ok(statusEs, 'ES form must contain #consulting-form-status');
    assert.ok(statusEn, 'EN form must contain #consulting-form-status');
    assert.equal(getAttribute(statusEs, 'role'), 'status');
    assert.equal(getAttribute(statusEn, 'role'), 'status');
    assert.equal(getAttribute(statusEs, 'aria-live'), 'polite');
    assert.equal(getAttribute(statusEn, 'aria-live'), 'polite');
  });

  it('BP-10: Integrity stress - No leaking template strings, undefined, null, or raw brackets', () => {
    for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
      const root = getConsultingRoot(doc);
      walk(root, (node) => {
        if (node.nodeName === '#text') {
          const val = node.value || '';
          assert.doesNotMatch(val, /undefined/i, `[${lang}] Leaked 'undefined' in text node: "${val}"`);
          assert.doesNotMatch(val, /\[object Object\]/, `[${lang}] Leaked '[object Object]' in text node: "${val}"`);
          assert.doesNotMatch(val, /NaN/, `[${lang}] Leaked 'NaN' in text node: "${val}"`);
          assert.doesNotMatch(val, /\{copy\./, `[${lang}] Leaked unrendered template expression '{copy.' in text node: "${val}"`);
          assert.doesNotMatch(val, /\{en \?/, `[${lang}] Leaked unrendered ternary expression '{en ?' in text node: "${val}"`);
        }
      });
    }
  });

  it('BP-11: Cross-contamination check - No accidental Spanish headers in EN, nor English headers in ES', () => {
    const secEnProblemas = getElementById(rootEn, 'problemas');
    const textEnProblemas = getTextContent(secEnProblemas);
    assert.doesNotMatch(textEnProblemas, /01 \/\/ PROBLEMAS Y FRICCIONES/, 'EN page must not display Spanish section header');
    assert.match(textEnProblemas, /01 \/\/ PROBLEMS & FRICTIONS/, 'EN page must display English section header');

    const secEsProblemas = getElementById(rootEs, 'problemas');
    const textEsProblemas = getTextContent(secEsProblemas);
    assert.doesNotMatch(textEsProblemas, /01 \/\/ PROBLEMS & FRICTIONS/, 'ES page must not display English section header');
    assert.match(textEsProblemas, /01 \/\/ PROBLEMAS Y FRICCIONES/, 'ES page must display Spanish section header');

    const secEnSoluciones = getElementById(rootEn, 'soluciones');
    const textEnSoluciones = getTextContent(secEnSoluciones);
    assert.doesNotMatch(textEnSoluciones, /02 \/\/ SOLUCIONES/, 'EN page must not display Spanish 02 // SOLUCIONES');
    assert.match(textEnSoluciones, /02 \/\/ SOLUTIONS/, 'EN page must display English 02 // SOLUTIONS');

    const secEnProceso = getElementById(rootEn, 'proceso');
    const textEnProceso = getTextContent(secEnProceso);
    assert.doesNotMatch(textEnProceso, /03 \/\/ PROCESO/, 'EN page must not display Spanish 03 // PROCESO');
    assert.match(textEnProceso, /03 \/\/ PROCESS/, 'EN page must display English 03 // PROCESS');

    const secEnInversion = getElementById(rootEn, 'inversion');
    const textEnInversion = getTextContent(secEnInversion);
    assert.doesNotMatch(textEnInversion, /07 \/\/ INVERSIÓN/, 'EN page must not display Spanish 07 // INVERSIÓN');
    assert.match(textEnInversion, /07 \/\/ INVESTMENT/, 'EN page must display English 07 // INVESTMENT');
  });

  it('BP-12: Accessibility & Markup integrity - no duplicate IDs within same document', () => {
    for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
      const root = getConsultingRoot(doc);
      const seenIds = new Set();
      const duplicateIds = [];

      walk(root, (node) => {
        if (node.nodeName && !node.nodeName.startsWith('#')) {
          const id = getAttribute(node, 'id');
          if (id) {
            if (seenIds.has(id)) {
              duplicateIds.push(id);
            } else {
              seenIds.add(id);
            }
          }
        }
      });

      assert.deepEqual(duplicateIds, [], `[${lang}] Duplicate element IDs found in consulting page: ${duplicateIds.join(', ')}`);
    }
  });
});
