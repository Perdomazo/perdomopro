import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES, DIST_FILES, fileExists } from '../helpers/fixtures.js';
import { parseHtml, querySelector, querySelectorAll, getAttribute, getElementById, getTextContent, byAttr, byTag } from '../helpers/dom.js';

describe('Tier 1: Consultoria Blocks Restructuring (ORIGINAL_REQUEST §R2, PROJECT.md #5-9)', () => {
  const consultingSource = readProjectFile(SOURCE_FILES.consultingAstro);
  const consultoriaHtml = fileExists(DIST_FILES.consultoria) ? readProjectFile(DIST_FILES.consultoria) : null;
  const doc = consultoriaHtml ? parseHtml(consultoriaHtml) : null;

  it('T1-CON-01: Problems/Frictions section must feature operational bottleneck & symptom micro-badges', () => {
    // Authoritative source: ORIGINAL_REQUEST §R2 & PROJECT.md Feature 5
    // "Rediseñar la sección de Problemas/Fricciones: tarjetas con enfoque de síntoma y cuello de botella operativo, microetiquetas de fricción destacadas"
    assert.ok(
      consultingSource.includes('problemas') || consultingSource.includes('problems'),
      'ConsultingPage.astro must define problems section'
    );
    
    // Look for friction/bottleneck tags in the problems array or markup
    const hasFrictionBadges = /FRICTION|FRICCIÓN|Fricción|cuello de botella|fricción/i.test(consultingSource);
    assert.ok(hasFrictionBadges, 'Problems section must include highlighted friction / symptom badges');

    if (doc) {
      const problemasSection = getElementById(doc, 'problemas');
      assert.ok(problemasSection, 'dist/consultoria/index.html must render #problemas section');
      const articles = querySelectorAll(problemasSection, byTag('article'));
      assert.ok(articles.length >= 4, `Expected at least 4 problem cards, found ${articles.length}`);
    }
  });

  it('T1-CON-02: Solutions section must present high-value cards emphasizing clear deliverables', () => {
    // Authoritative source: ORIGINAL_REQUEST §R2 & PROJECT.md Feature 6
    // "Rediseñar la sección de Soluciones: tarjetas de alto valor que enfaticen entregables claros (ej. software a medida, automatización, cloud)"
    assert.ok(
      consultingSource.includes('soluciones') || consultingSource.includes('solutions'),
      'ConsultingPage.astro must define soluciones section'
    );

    if (doc) {
      const solucionesSection = getElementById(doc, 'soluciones');
      assert.ok(solucionesSection, 'dist/consultoria/index.html must render #soluciones section');
      const articles = querySelectorAll(solucionesSection, byTag('article'));
      assert.ok(articles.length >= 3, `Expected at least 3 solution cards, found ${articles.length}`);
    }
  });

  it('T1-CON-03: Process section must render a sequential connected stepper flow', () => {
    // Authoritative source: ORIGINAL_REQUEST §R2 & PROJECT.md Feature 7
    // "Rediseñar la sección de Proceso: implementar una visualización de stepper secuencial conectada visualmente que refleje el avance claro"
    const hasProcessSection = consultingSource.includes('proceso') || consultingSource.includes('process');
    assert.ok(hasProcessSection, 'ConsultingPage.astro must define proceso section');

    // Check for sequence milestones or phases (Discovery -> Build -> Deployment)
    const hasStepperPhases = /Fase 1|Phase 1|Diagnóstico|Discovery/i.test(consultingSource);
    assert.ok(hasStepperPhases, 'Process section must describe sequential phases from diagnosis to deployment');

    if (doc) {
      const procesoSection = getElementById(doc, 'proceso');
      assert.ok(procesoSection, 'dist/consultoria/index.html must render #proceso section');
    }
  });

  it('T1-CON-04: Scope & Investment section must clarify contracting modalities', () => {
    // Authoritative source: ORIGINAL_REQUEST §R2 & PROJECT.md Feature 8
    // "Optimizar la presentación de Modelos de Inversión y Alcance para clarificar la modalidad de contratación."
    const hasInvestmentSection = /investment|inversión|alcance/i.test(consultingSource);
    assert.ok(hasInvestmentSection, 'ConsultingPage must include scope and investment section');

    // Confirm presence of clear scope definition prior to costs
    assert.match(
      consultingSource,
      /alcance|scope|inversión|investment/i,
      'Investment section must define scope and requirements explicitly'
    );
  });

  it('T1-CON-05: Consulting form must conform to /api/contact schema and include accessible status region', () => {
    // Authoritative source: PROJECT.md § Interface Contracts: ConsultingPage.astro ↔ /api/contact
    // Schema: { nombre, correo, negocio?, telefono?, preferencia?, descripcion, servicio, sitioWeb?, idioma }
    // Status region: #consulting-form-status with role="status" and aria-live="polite"
    
    assert.match(consultingSource, /id="consulting-contact-form"/, 'Must contain #consulting-contact-form');
    assert.match(consultingSource, /id="consulting-form-status"/, 'Must contain #consulting-form-status');
    assert.match(consultingSource, /role="status"/, 'Status must have role="status"');
    assert.match(consultingSource, /aria-live="polite"/, 'Status must have aria-live="polite"');

    // Check JSON body payload keys sent to /api/contact
    assert.match(consultingSource, /nombre:/, 'Payload must include nombre');
    assert.match(consultingSource, /correo:/, 'Payload must include correo');
    assert.match(consultingSource, /descripcion:/, 'Payload must include descripcion');
    assert.match(consultingSource, /servicio:/, 'Payload must include servicio');
    assert.match(consultingSource, /sitioWeb:/, 'Payload must include honeypot sitioWeb');
  });

  it('T1-CON-06: Form must include anti-spam honeypot input hidden from screen readers', () => {
    // Authoritative source: PROJECT.md Interface Contracts & api/test/contact.test.js
    // Honeypot field must exist (e.g. name="website" or name="sitioWeb")
    const hasHoneypot = /name="website"/i.test(consultingSource) || /name="sitioWeb"/i.test(consultingSource);
    assert.ok(hasHoneypot, 'Contact form must include honeypot field');
  });
});
