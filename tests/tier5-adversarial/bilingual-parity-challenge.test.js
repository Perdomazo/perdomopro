import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, DIST_FILES, fileExists } from '../helpers/fixtures.js';
import {
  parseHtml,
  querySelector,
  querySelectorAll,
  getAttribute,
  getClasses,
  getElementById,
  getTextContent,
  byAttr,
  byTag,
  walk,
} from '../helpers/dom.js';

describe('Tier 5 Adversarial: Bilingual Parity & DOM Integrity Challenge (5-Section Consulting)', () => {
  const consultoriaPath = DIST_FILES.consultoria;
  const enConsultingPath = DIST_FILES.enConsulting;

  assert.ok(fileExists(consultoriaPath), `${consultoriaPath} must exist`);
  assert.ok(fileExists(enConsultingPath), `${enConsultingPath} must exist`);

  const esHtml = readProjectFile(consultoriaPath);
  const enHtml = readProjectFile(enConsultingPath);

  const docEs = parseHtml(esHtml);
  const docEn = parseHtml(enHtml);

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

    for (let i = 0; i < revealsEs.length; i++) {
      const elEs = revealsEs[i];
      const elEn = revealsEn[i];
      assert.equal(
        elEs.tagName,
        elEn.tagName,
        `Reveal item #${i} tag mismatch: ES=<${elEs.tagName}> vs EN=<${elEn.tagName}>`
      );

      const classesEs = getClasses(elEs).sort();
      const classesEn = getClasses(elEn).sort();
      assert.deepEqual(
        classesEs,
        classesEn,
        `Reveal item #${i} (<${elEs.tagName}>) CSS class mismatch: ES=${classesEs.join(' ')} vs EN=${classesEn.join(' ')}`
      );
    }
  });

  it('BP-04: Section structure & ID symmetry across strictly 5 high-conversion sections', () => {
    const expectedSections = [
      'inicio-consultoria',
      'soluciones',
      'proceso',
      'modalidades',
      'contacto',
    ];

    const sectionsEs = querySelectorAll(rootEs, byTag('section'));
    const sectionsEn = querySelectorAll(rootEn, byTag('section'));

    assert.equal(sectionsEs.length, 5, `ES sections count (${sectionsEs.length}) must be strictly 5`);
    assert.equal(sectionsEn.length, 5, `EN sections count (${sectionsEn.length}) must be strictly 5`);

    expectedSections.forEach((id, idx) => {
      assert.equal(getAttribute(sectionsEs[idx], 'id'), id, `ES section #${idx + 1} must be #${id}`);
      assert.equal(getAttribute(sectionsEn[idx], 'id'), id, `EN section #${idx + 1} must be #${id}`);
    });

    assert.ok(getElementById(rootEs, 'faq'), 'ES must include #faq anchor inside #modalidades');
    assert.ok(getElementById(rootEn, 'faq'), 'EN must include #faq anchor inside #modalidades');
  });

  it('BP-05: Hero (#inicio-consultoria) 3 quick guarantees & spec list symmetry', () => {
    const heroEs = getElementById(rootEs, 'inicio-consultoria');
    const heroEn = getElementById(rootEn, 'inicio-consultoria');

    const guaranteesEs = querySelectorAll(querySelector(heroEs, byAttr('data-hero-guarantees')), byTag('li'));
    const guaranteesEn = querySelectorAll(querySelector(heroEn, byAttr('data-hero-guarantees')), byTag('li'));

    assert.equal(guaranteesEs.length, 3, 'ES Hero must display 3 quick guarantees');
    assert.equal(guaranteesEn.length, 3, 'EN Hero must display 3 quick guarantees');
  });

  it('BP-06: Solutions section (#soluciones) structural symmetry across 4 unified Pain+Solution+Outcome cards', () => {
    const secEs = getElementById(rootEs, 'soluciones');
    const secEn = getElementById(rootEn, 'soluciones');

    const articlesEs = querySelectorAll(secEs, byTag('article'));
    const articlesEn = querySelectorAll(secEn, byTag('article'));

    assert.equal(articlesEs.length, 4, 'ES must have exactly 4 unified solution articles');
    assert.equal(articlesEn.length, 4, 'EN must have exactly 4 unified solution articles');

    for (let i = 0; i < 4; i++) {
      const artEs = articlesEs[i];
      const artEn = articlesEn[i];

      const lisEs = querySelectorAll(artEs, byTag('li'));
      const lisEn = querySelectorAll(artEn, byTag('li'));
      assert.equal(lisEs.length, 3, `ES solution ${i + 1} must have 3 business bullet points`);
      assert.equal(lisEn.length, 3, `EN solution ${i + 1} must have 3 business bullet points`);

      const textEs = getTextContent(artEs);
      const textEn = getTextContent(artEn);
      assert.ok(textEs.includes('Resuelve:'), `ES solution ${i + 1} must state 'Resuelve:' pain hook`);
      assert.ok(textEn.includes('Solves:'), `EN solution ${i + 1} must state 'Solves:' pain hook`);
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
      assert.ok(textEs.includes('ENTREGABLE'), `ES step ${i + 1} must have ENTREGABLE`);
      assert.ok(textEn.includes('DELIVERABLE'), `EN step ${i + 1} must have DELIVERABLE`);
    }
  });

  it('BP-08: Modalidades & Garantías (#modalidades) tier cards, sovereignty block & 4 FAQs parity', () => {
    const secEs = getElementById(rootEs, 'modalidades');
    const secEn = getElementById(rootEn, 'modalidades');

    const articlesEs = querySelectorAll(secEs, byTag('article'));
    const articlesEn = querySelectorAll(secEn, byTag('article'));

    assert.equal(articlesEs.length, 3, 'ES modalidades must have 3 tier articles');
    assert.equal(articlesEn.length, 3, 'EN modalidades must have 3 tier articles');

    for (let i = 0; i < 3; i++) {
      const lisEs = querySelectorAll(articlesEs[i], byTag('li'));
      const lisEn = querySelectorAll(articlesEn[i], byTag('li'));
      assert.equal(lisEs.length, 4, `ES tier ${i + 1} must have 4 inclusion items`);
      assert.equal(lisEn.length, 4, `EN tier ${i + 1} must have 4 inclusion items`);
    }

    const csEs = getTextContent(secEs);
    const csEn = getTextContent(secEn);
    assert.ok(csEs.includes('SOBERANÍA TECNOLÓGICA'), 'ES must include sovereignty badge');
    assert.ok(csEn.includes('TECHNOLOGICAL SOVEREIGNTY'), 'EN must include sovereignty badge');

    const faqEs = querySelectorAll(getElementById(rootEs, 'faq'), byTag('details'));
    const faqEn = querySelectorAll(getElementById(rootEn, 'faq'), byTag('details'));
    assert.equal(faqEs.length, 4, 'ES FAQ must have strictly 4 operational items');
    assert.equal(faqEn.length, 4, 'EN FAQ must have strictly 4 operational items');
  });

  it('BP-09: Contact Form (#consulting-contact-form) field symmetry, schemas, and live feedback region', () => {
    const formEs = getElementById(rootEs, 'consulting-contact-form');
    const formEn = getElementById(rootEn, 'consulting-contact-form');

    assert.ok(formEs, 'ES page must have form #consulting-contact-form');
    assert.ok(formEn, 'EN page must have form #consulting-contact-form');

    assert.equal(getAttribute(formEs, 'data-locale'), 'es-MX');
    assert.equal(getAttribute(formEn, 'data-locale'), 'en');

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

    const inputsEs = querySelectorAll(formEs, byTag('input')).map((n) => getAttribute(n, 'name')).filter(Boolean);
    const inputsEn = querySelectorAll(formEn, byTag('input')).map((n) => getAttribute(n, 'name')).filter(Boolean);

    assert.deepEqual(inputsEs.sort(), inputsEn.sort(), 'Input field names must match between ES and EN forms');
    assert.ok(inputsEs.includes('website'), 'Form must have honeypot website input');
    assert.ok(inputsEs.includes('name'), 'Form must have name input');
    assert.ok(inputsEs.includes('email'), 'Form must have email input');

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

  it('BP-11: Cross-contamination & clean single-slash header check (01 / ... through 05 / ...)', () => {
    const fullEs = getTextContent(rootEs);
    const fullEn = getTextContent(rootEn);

    // Ensure old double-slash headers are completely gone
    assert.doesNotMatch(fullEs, /0[1-9]\s*\/\//, 'ES page must not use legacy double-slash // headers');
    assert.doesNotMatch(fullEn, /0[1-9]\s*\/\//, 'EN page must not use legacy double-slash // headers');

    assert.match(fullEs, /01 \/ CONSULTORÍA PYME/);
    assert.match(fullEs, /02 \/ SOLUCIONES/);
    assert.match(fullEs, /03 \/ PROCESO/);
    assert.match(fullEs, /04 \/ MODALIDADES Y GARANTÍAS/);
    assert.match(fullEs, /05 \/ CONTACTO/);

    assert.match(fullEn, /01 \/ SMB CONSULTING/);
    assert.match(fullEn, /02 \/ SOLUTIONS/);
    assert.match(fullEn, /03 \/ PROCESS/);
    assert.match(fullEn, /04 \/ MODELS & GUARANTEES/);
    assert.match(fullEn, /05 \/ CONTACT/);
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
