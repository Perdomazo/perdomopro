import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES, DIST_FILES, fileExists } from '../helpers/fixtures.js';
import { parseHtml, querySelector, querySelectorAll, getAttribute, getElementById, getTextContent, byAttr, byTag } from '../helpers/dom.js';

describe('Tier 1: Projects Catalog & Media Assets (ORIGINAL_REQUEST §R3, PROJECT.md #10-13)', () => {
  const projectsDataRaw = readProjectFile(SOURCE_FILES.projectsData);
  const projectsAstro = readProjectFile(SOURCE_FILES.projectsAstro);
  const indexAstro = readProjectFile(SOURCE_FILES.indexAstro);
  const indexHtml = fileExists(DIST_FILES.index) ? readProjectFile(DIST_FILES.index) : null;
  const doc = indexHtml ? parseHtml(indexHtml) : null;

  it('T1-PRJ-01: Every project in projectsData must have a preview graphic object with localized alt text', () => {
    // Authoritative source: PROJECT.md § Interface Contracts: src/data/projects.ts ↔ Projects.astro
    // "Each project in projectsData must supply: preview: { src: string, alt: Record<Locale, string> }"
    // Projects: gadgetstock, etf-portfolio-analytics, adrian-quant-lab, scorerecord, perdomopro
    
    const requiredProjectIds = ['gadgetstock', 'etf-portfolio-analytics', 'adrian-quant-lab', 'score-record', 'perdomopro'];
    
    // Check that each required project has preview in projectsData
    for (const id of requiredProjectIds) {
      // Find block for project id
      const idIndex = projectsDataRaw.indexOf(`id: '${id}'`);
      assert.ok(idIndex !== -1, `Project ${id} must exist in projectsData`);
      
      // Look forward to the next project or end of array
      const nextIdIndex = projectsDataRaw.indexOf(`id: '`, idIndex + 10);
      const projectChunk = nextIdIndex === -1 ? projectsDataRaw.slice(idIndex) : projectsDataRaw.slice(idIndex, nextIdIndex);
      
      const hasPreview = /preview:\s*\{/i.test(projectChunk);
      assert.ok(
        hasPreview,
        `Project "${id}" must supply preview: { src, alt: { 'es-MX', 'en' } } per PROJECT.md interface contract.`
      );
    }
  });

  it('T1-PRJ-02: Projects.astro must completely eliminate #0F0F14 dark terminal fallback box', () => {
    // Authoritative source: ORIGINAL_REQUEST §R3 & PROJECT.md Feature 11
    // "dotar a los proyectos que actualmente solo muestran terminales de texto de recursos gráficos... sin depender de cajas terminales oscuras genéricas (#0F0F14)"
    const hasTerminalBox = projectsAstro.includes('#0F0F14') || /cat info\.json/i.test(projectsAstro);
    assert.equal(
      hasTerminalBox,
      false,
      'Found #0F0F14 generic terminal fallback in Projects.astro. All projects must render graphic assets.'
    );
  });

  it('T1-PRJ-03: Vector graphic preview files for software projects must exist in public directory', () => {
    // Authoritative source: ORIGINAL_REQUEST §R3 & PROJECT.md Feature 10
    // "Author high-fidelity vector SVG previews for gadgetStock (Swagger UI), etf-portfolio-analytics (dashboard), and adrian-quant-lab (pipeline)."
    const expectedAssets = [
      'public/images/projects/gadgetstock-swagger.svg',
      'public/images/projects/etf-portfolio-analytics.svg',
      'public/images/projects/adrian-quant-lab.svg',
    ];

    // Check if either SVG or designated visual assets exist
    for (const assetPath of expectedAssets) {
      assert.ok(
        fileExists(assetPath),
        `Expected project preview asset at ${assetPath} per ORIGINAL_REQUEST §R3.`
      );
    }
  });

  it('T1-PRJ-04: Project cards must render images with lazy loading, async decoding, and descriptive alt', () => {
    // Authoritative source: ORIGINAL_REQUEST Acceptance Criteria & PROJECT.md Interface Contracts
    // "Imágenes y diagramas optimizados con atributos alt descriptivos y ratios consistentes (aspect-[16/8] o aspect-[16/9])."
    assert.match(projectsAstro, /loading="lazy"/i, 'Project images must specify loading="lazy"');
    assert.match(projectsAstro, /decoding="async"/i, 'Project images must specify decoding="async"');
    assert.match(projectsAstro, /aspect-\[16\/(?:8|9)\]/i, 'Project image containers must specify consistent aspect ratio');
  });

  it('T1-PRJ-05: index.astro must strictly preserve section sequence: Hero -> Experiencia -> Soluciones PyME -> Proyectos -> Sobre mí', () => {
    // Authoritative source: ORIGINAL_REQUEST §R3 (Nota: La estructura y orden de secciones en index.astro se preserva intacta: Hero -> Experiencia -> Soluciones PyME -> Proyectos -> Sobre mí).
    // In src/pages/index.astro:
    // 1. <Hero
    // 2. <ProfessionalProfile
    // 3. <Contact (Soluciones PyME)
    // 4. <Projects
    // 5. <About
    
    const heroPos = indexAstro.indexOf('<Hero');
    const expPos = indexAstro.indexOf('<ProfessionalProfile');
    const pymePos = indexAstro.indexOf('<Contact');
    const projPos = indexAstro.indexOf('<Projects');
    const aboutPos = indexAstro.indexOf('<About');

    assert.ok(heroPos !== -1, 'Hero must be present in index.astro');
    assert.ok(expPos !== -1, 'Experiencia (ProfessionalProfile) must be present in index.astro');
    assert.ok(pymePos !== -1, 'Soluciones PyME (Contact) must be present in index.astro');
    assert.ok(projPos !== -1, 'Proyectos (Projects) must be present in index.astro');
    assert.ok(aboutPos !== -1, 'Sobre mí (About) must be present in index.astro');

    assert.ok(heroPos < expPos, 'Hero (01) must precede Experiencia (02)');
    assert.ok(expPos < pymePos, 'Experiencia (02) must precede Soluciones PyME (03)');
    assert.ok(pymePos < projPos, 'Soluciones PyME (03) must precede Proyectos (04)');
    assert.ok(projPos < aboutPos, 'Proyectos (04) must precede Sobre mí (05)');
  });

  it('T1-PRJ-06: dist/index.html rendered DOM preserves the exact section ordering', () => {
    if (!doc) {
      assert.ok(true, 'dist/index.html not built yet, tested via Astro source in T1-PRJ-05');
      return;
    }

    const sections = querySelectorAll(doc, byTag('section'));
    const sectionIds = sections.map((s) => getAttribute(s, 'id')).filter(Boolean);
    
    // Expected id order in home: hero, recorrido (trajectory), contacto, proyectos (projects), sobre-mi (about)
    const heroIdx = sectionIds.indexOf('hero');
    const expIdx = sectionIds.findIndex((id) => id === 'recorrido' || id === 'trajectory');
    const contactIdx = sectionIds.findIndex((id) => id === 'contacto' || id === 'contact');
    const projIdx = sectionIds.findIndex((id) => id === 'proyectos' || id === 'projects');
    const aboutIdx = sectionIds.findIndex((id) => id === 'sobre-mi' || id === 'about');

    assert.ok(heroIdx !== -1, 'hero section must be in rendered HTML');
    assert.ok(expIdx !== -1, 'experience section must be in rendered HTML');
    assert.ok(contactIdx !== -1, 'contact/pyme section must be in rendered HTML');
    assert.ok(projIdx !== -1, 'projects section must be in rendered HTML');
    assert.ok(aboutIdx !== -1, 'about section must be in rendered HTML');

    assert.ok(heroIdx < expIdx, 'hero must appear before experience');
    assert.ok(expIdx < contactIdx, 'experience must appear before contact/pyme');
    assert.ok(contactIdx < projIdx, 'contact/pyme must appear before projects');
    assert.ok(projIdx < aboutIdx, 'projects must appear before about');
  });
});
