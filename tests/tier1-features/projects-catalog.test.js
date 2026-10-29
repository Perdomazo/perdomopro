import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES, DIST_FILES, fileExists } from '../helpers/fixtures.js';
import { parseHtml, querySelectorAll, getAttribute, getTextContent, byTag } from '../helpers/dom.js';

describe('Tier 1: Projects Catalog & Engineering Homepage Architecture', () => {
  const projectsDataRaw = readProjectFile(SOURCE_FILES.projectsData);
  const projectsAstro = readProjectFile(SOURCE_FILES.projectsAstro);
  const indexAstro = readProjectFile(SOURCE_FILES.indexAstro);
  const indexHtml = fileExists(DIST_FILES.index) ? readProjectFile(DIST_FILES.index) : null;
  const doc = indexHtml ? parseHtml(indexHtml) : null;

  it('T1-PRJ-01: Every project in projectsData must provide localized summary and highlightPill in es-MX and en', () => {
    const requiredProjectIds = ['score-record', 'gadgetstock', 'etf-portfolio-analytics', 'adrian-quant-lab', 'perdomopro'];

    for (const id of requiredProjectIds) {
      const idIndex = projectsDataRaw.indexOf(`id: '${id}'`);
      assert.ok(idIndex !== -1, `Project ${id} must exist in projectsData`);

      const nextIdIndex = projectsDataRaw.indexOf(`id: '`, idIndex + 10);
      const projectChunk = nextIdIndex === -1 ? projectsDataRaw.slice(idIndex) : projectsDataRaw.slice(idIndex, nextIdIndex);

      const summaryMatches = [...projectChunk.matchAll(/summary:\s*'([^']+)'/g)];
      const pillMatches = [...projectChunk.matchAll(/highlightPill:\s*'([^']+)'/g)];

      assert.equal(summaryMatches.length, 2, `Project "${id}" must supply localized summary for es-MX and en`);
      assert.equal(pillMatches.length, 2, `Project "${id}" must supply localized highlightPill for es-MX and en`);
    }
  });

  it('T1-PRJ-02: Projects.astro must completely eliminate #0F0F14 dark terminal fallback box and defensive labels', () => {
    const hasTerminalBox = projectsAstro.includes('#0F0F14') || /cat info\.json/i.test(projectsAstro);
    assert.equal(
      hasTerminalBox,
      false,
      'Found #0F0F14 generic terminal fallback in Projects.astro. Cards must remain compact and clean.'
    );

    const hasVerboseLabels = /projects\.problemLabel|projects\.builtLabel/.test(projectsAstro);
    assert.equal(
      hasVerboseLabels,
      false,
      'Projects.astro must replace split PUNTO DE PARTIDA / QUÉ CONSTRUÍ blocks with a compact summary.'
    );

    const hasSelfReloadingLiveLink = /projects\.liveLink/.test(projectsAstro);
    assert.equal(
      hasSelfReloadingLiveLink,
      false,
      'Projects.astro must link to CI/CD pipeline instead of reloading perdomopro.com via SITIO EN VIVO'
    );
    assert.match(
      projectsAstro,
      /projects\.pipelineLink/,
      'Projects.astro must render the CI/CD pipeline link on cards with pipelineHref'
    );
  });

  it('T1-PRJ-03: ProjectsData retains preview & built compatibility for /consultoria/ showcase', () => {
    const consultingShowcaseIds = ['perdomopro', 'score-record'];
    for (const id of consultingShowcaseIds) {
      const idIndex = projectsDataRaw.indexOf(`id: '${id}'`);
      assert.ok(idIndex !== -1, `Showcase project ${id} must exist`);
      const nextIdIndex = projectsDataRaw.indexOf(`id: '`, idIndex + 10);
      const chunk = nextIdIndex === -1 ? projectsDataRaw.slice(idIndex) : projectsDataRaw.slice(idIndex, nextIdIndex);
      assert.match(chunk, /preview:\s*\{/i, `Showcase project ${id} must preserve preview asset metadata`);
      assert.match(chunk, /built:\s*'/i, `Showcase project ${id} must preserve built description for /consultoria/`);
    }
  });

  it('T1-PRJ-04: index.astro enforces clean engineering sequence: Hero -> Experiencia -> Stack -> Proyectos -> Sobre mí -> Contacto', () => {
    const heroPos = indexAstro.indexOf('<Hero');
    const expPos = indexAstro.indexOf('<ProfessionalProfile');
    const stackPos = indexAstro.indexOf('<Stack');
    const projPos = indexAstro.indexOf('<Projects');
    const aboutPos = indexAstro.indexOf('<About');
    const contactPos = indexAstro.indexOf('<Contact');

    assert.ok(heroPos !== -1, 'Hero must be present in index.astro');
    assert.ok(expPos !== -1, 'ProfessionalProfile must be present in index.astro');
    assert.ok(stackPos !== -1, 'Stack must be present in index.astro');
    assert.ok(projPos !== -1, 'Projects must be present in index.astro');
    assert.ok(aboutPos !== -1, 'About must be present in index.astro');
    assert.ok(contactPos !== -1, 'Contact must be present in index.astro');

    assert.ok(heroPos < expPos, 'Hero (01) must precede Experiencia (02)');
    assert.ok(expPos < stackPos, 'Experiencia (02) must precede Stack (03)');
    assert.ok(stackPos < projPos, 'Stack (03) must precede Proyectos (04)');
    assert.ok(projPos < aboutPos, 'Proyectos (04) must precede Sobre mí (05)');
    assert.ok(aboutPos < contactPos, 'Sobre mí (05) must precede Contacto (06)');
  });

  it('T1-PRJ-05: dist/index.html rendered DOM preserves the exact section ordering and engineering elements', () => {
    if (!doc) {
      assert.ok(true, 'dist/index.html not built yet, tested via Astro source in T1-PRJ-04');
      return;
    }

    const sections = querySelectorAll(doc, byTag('section'));
    const sectionIds = sections.map((s) => getAttribute(s, 'id')).filter(Boolean);

    const heroIdx = sectionIds.indexOf('hero');
    const expIdx = sectionIds.findIndex((id) => id === 'recorrido' || id === 'trajectory');
    const stackIdx = sectionIds.indexOf('stack');
    const projIdx = sectionIds.findIndex((id) => id === 'proyectos' || id === 'projects');
    const aboutIdx = sectionIds.findIndex((id) => id === 'sobre-mi' || id === 'about');
    const contactIdx = sectionIds.findIndex((id) => id === 'contacto' || id === 'contact');

    assert.ok(heroIdx !== -1, 'hero section must be in rendered HTML');
    assert.ok(expIdx !== -1, 'experience section must be in rendered HTML');
    assert.ok(stackIdx !== -1, 'stack section must be in rendered HTML');
    assert.ok(projIdx !== -1, 'projects section must be in rendered HTML');
    assert.ok(aboutIdx !== -1, 'about section must be in rendered HTML');
    assert.ok(contactIdx !== -1, 'contact section must be in rendered HTML');

    assert.ok(heroIdx < expIdx, 'hero must appear before experience');
    assert.ok(expIdx < stackIdx, 'experience must appear before stack');
    assert.ok(stackIdx < projIdx, 'stack must appear before projects');
    assert.ok(projIdx < aboutIdx, 'projects must appear before about');
    assert.ok(aboutIdx < contactIdx, 'about must appear before contact');

    // Verify impact bullets (›) and ICPC mention in rendered homepage
    const fullText = getTextContent(doc);
    assert.ok(fullText.includes('›'), 'Experience section must render › impact bullets');
    assert.ok(fullText.includes('ICPC Mexico Finals 2025'), 'Education card must highlight ICPC Mexico Finals 2025');
  });
});
