import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES, DIST_FILES, fileExists } from '../helpers/fixtures.js';
import { parseHtml, querySelectorAll, getElementById, getTextContent, byTag } from '../helpers/dom.js';

describe('Tier 1: Consultoria High-Conversion 5-Section Architecture', () => {
  const consultingSource = readProjectFile(SOURCE_FILES.consultingAstro);
  const consultoriaHtml = fileExists(DIST_FILES.consultoria) ? readProjectFile(DIST_FILES.consultoria) : null;
  const doc = consultoriaHtml ? parseHtml(consultoriaHtml) : null;

  it('T1-CON-01: Hero (#inicio-consultoria) features full-viewport centering, 3 quick guarantees, and removes 4-box quickNav & personal projects', () => {
    assert.match(
      consultingSource,
      /min-h-\[calc\(100svh-4rem\)\]/,
      'Consulting Hero must share full-viewport vertical centering with perdomopro.com'
    );
    assert.doesNotMatch(
      consultingSource,
      /EXPLORA SEGÚN LO QUE BUSCAS HOY|no casos de clientes|not client case studies/i,
      'ConsultingPage.astro must remove quickNav index boxes and self-sabotaging personal-project disclaimers'
    );

    if (doc) {
      const hero = getElementById(doc, 'inicio-consultoria');
      assert.ok(hero, 'dist/consultoria/index.html must render #inicio-consultoria');
      const heroText = getTextContent(hero);
      assert.ok(heroText.includes('Sin rentas mensuales por usuario'), 'Hero must include per-user fee guarantee');
      assert.ok(heroText.includes('Código y cuentas 100% a tu nombre'), 'Hero must include code & account ownership guarantee');
      assert.ok(heroText.includes('Trato directo en Guadalajara y remoto'), 'Hero must include direct service guarantee');
      assert.equal(getElementById(doc, 'problemas'), null, 'Legacy #problemas section must be removed');
      assert.equal(getElementById(doc, 'proyectos'), null, 'Legacy #proyectos section must be removed from /consultoria/');
    }
  });

  it('T1-CON-02: Solutions (#soluciones) unites Pain + Deliverable + Business Outcome across 4 symmetric cards without engineering jargon', () => {
    assert.doesNotMatch(
      consultingSource,
      /Lighthouse|serverless|relacional estructurada|candidata a lanzamiento/i,
      'Consulting copy must speak business-owner language without engineering jargon'
    );

    if (doc) {
      const solucionesSection = getElementById(doc, 'soluciones');
      assert.ok(solucionesSection, 'dist/consultoria/index.html must render #soluciones section');
      const articles = querySelectorAll(solucionesSection, byTag('article'));
      assert.equal(articles.length, 4, `Expected exactly 4 unified solution cards, found ${articles.length}`);
    }
  });

  it('T1-CON-03: Process (#proceso) renders a 3-step sequential connected stepper in business language', () => {
    const hasProcessSection = consultingSource.includes('id="proceso"');
    assert.ok(hasProcessSection, 'ConsultingPage.astro must define #proceso section');
    assert.doesNotMatch(consultingSource, /Sprints de 2 a 4 semanas/i, 'Process must avoid sprint jargon');
    assert.match(consultingSource, /Diagnóstico y presupuesto cerrado/, 'Step 1 must state Diagnosis & closed quote');
    assert.match(consultingSource, /Construcción con avances visibles/, 'Step 2 must state Build with visible progress');
    assert.match(consultingSource, /Puesta en marcha y capacitación/, 'Step 3 must state Go-live & training');

    if (doc) {
      const procesoSection = getElementById(doc, 'proceso');
      assert.ok(procesoSection, 'dist/consultoria/index.html must render #proceso section');
    }
  });

  it('T1-CON-04: Modalidades & Garantías (#modalidades) combines 3 contracting models, Technological Sovereignty, and 4 operational FAQs (#faq)', () => {
    assert.match(consultingSource, /id="modalidades"/, 'Must include #modalidades section');
    assert.match(consultingSource, /SOBERANÍA TECNOLÓGICA/, 'Must highlight Technological Sovereignty guarantee');

    if (doc) {
      const modalidadesSection = getElementById(doc, 'modalidades');
      assert.ok(modalidadesSection, 'dist/consultoria/index.html must render #modalidades');
      const tierCards = querySelectorAll(modalidadesSection, byTag('article'));
      assert.equal(tierCards.length, 3, 'Must render 3 contracting model cards');

      const faqContainer = getElementById(doc, 'faq');
      assert.ok(faqContainer, 'Must render #faq anchor inside #modalidades');
      const details = querySelectorAll(faqContainer, byTag('details'));
      assert.equal(details.length, 4, 'FAQ accordion must contain strictly 4 operational questions');
    }
  });

  it('T1-CON-05: Consulting form must conform to /api/contact schema and include accessible status region', () => {
    assert.match(consultingSource, /id="consulting-contact-form"/, 'Must contain #consulting-contact-form');
    assert.match(consultingSource, /id="consulting-form-status"/, 'Must contain #consulting-form-status');
    assert.match(consultingSource, /role="status"/, 'Status must have role="status"');
    assert.match(consultingSource, /aria-live="polite"/, 'Status must have aria-live="polite"');

    assert.match(consultingSource, /nombre:/, 'Payload must include nombre');
    assert.match(consultingSource, /correo:/, 'Payload must include correo');
    assert.match(consultingSource, /descripcion:/, 'Payload must include descripcion');
    assert.match(consultingSource, /servicio:/, 'Payload must include servicio');
    assert.match(consultingSource, /sitioWeb:/, 'Payload must include honeypot sitioWeb');
  });

  it('T1-CON-06: Form must include anti-spam honeypot input hidden from screen readers', () => {
    const hasHoneypot = /name="website"/i.test(consultingSource) || /name="sitioWeb"/i.test(consultingSource);
    assert.ok(hasHoneypot, 'Contact form must include honeypot field');
  });
});
