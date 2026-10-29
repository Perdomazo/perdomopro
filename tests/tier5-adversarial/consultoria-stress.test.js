import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readProjectFile, SOURCE_FILES, DIST_FILES, fileExists } from '../helpers/fixtures.js';
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
} from '../helpers/dom.js';

const require = createRequire(import.meta.url);
const { handleContact } = require('../../api/src/functions/contact.js');

describe('Tier 5 Adversarial: Consultoria Empirical Stress Tests (5-Section Architecture)', () => {
  const consultingSource = readProjectFile(SOURCE_FILES.consultingAstro);
  const consultoriaHtml = fileExists(DIST_FILES.consultoria) ? readProjectFile(DIST_FILES.consultoria) : null;
  const enConsultingHtml = fileExists(DIST_FILES.enConsulting) ? readProjectFile(DIST_FILES.enConsulting) : null;

  const docEs = consultoriaHtml ? parseHtml(consultoriaHtml) : null;
  const docEn = enConsultingHtml ? parseHtml(enConsultingHtml) : null;

  // -------------------------------------------------------------------------
  // 1. STEPPER CONNECTIVITY ACROSS VIEWPORTS (320px, 768px, 1024px)
  // -------------------------------------------------------------------------
  describe('Stepper Connectivity Stress Tests (320px, 768px, 1024px)', () => {
    it('T5-CON-STEP-01: Process section has semantic ordered list <ol> with exactly 3 milestone steps', () => {
      assert.ok(docEs, 'dist/consultoria/index.html must exist');
      assert.ok(docEn, 'dist/en/consulting/index.html must exist');

      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const procesoSection = getElementById(doc, 'proceso');
        assert.ok(procesoSection, `[${lang}] #proceso section must exist in DOM`);

        const ol = querySelector(procesoSection, byTag('ol'));
        assert.ok(ol, `[${lang}] Stepper must use semantic <ol> container`);

        const listItems = querySelectorAll(ol, byTag('li'));
        assert.equal(listItems.length, 3, `[${lang}] Stepper must have exactly 3 milestone steps in <ol>`);

        const expectedMilestones = ['01', '02', '03'];
        listItems.forEach((li, idx) => {
          const text = getTextContent(li);
          assert.ok(
            text.includes(expectedMilestones[idx]),
            `[${lang}] Step ${idx + 1} must display milestone node ${expectedMilestones[idx]}`
          );
          assert.ok(
            text.includes('ENTREGABLE') || text.includes('DELIVERABLE'),
            `[${lang}] Step ${idx + 1} must include concrete deliverable footnote`
          );
        });
      }
    });

    it('T5-CON-STEP-02: Desktop Viewport (>= 768px md: / 1024px lg:) connectivity track and horizontal arrows', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const procesoSection = getElementById(doc, 'proceso');
        assert.ok(procesoSection, `[${lang}] #proceso must exist`);

        const rail = querySelector(procesoSection, (node) => {
          const classes = getClasses(node);
          return (
            classes.includes('hidden') &&
            classes.includes('md:block') &&
            classes.includes('absolute')
          );
        });
        assert.ok(rail, `[${lang}] Desktop progress rail must have hidden md:block absolute classes`);

        const railClasses = getClasses(rail);
        assert.ok(railClasses.includes('top-[28px]'), `[${lang}] Rail must align vertically at top-[28px] with milestone nodes`);
        assert.ok(railClasses.includes('left-[16.66%]'), `[${lang}] Rail must start at center of 1st column (left-[16.66%])`);
        assert.ok(railClasses.includes('right-[16.66%]'), `[${lang}] Rail must terminate at center of 3rd column (right-[16.66%])`);
        assert.equal(getAttribute(rail, 'aria-hidden'), 'true', `[${lang}] Rail must be aria-hidden="true"`);

        const ol = querySelector(procesoSection, byTag('ol'));
        const olClasses = getClasses(ol);
        assert.ok(
          olClasses.includes('grid') && olClasses.includes('md:grid-cols-3'),
          `[${lang}] Stepper <ol> must be a 3-column responsive grid (md:grid-cols-3)`
        );

        const steps = querySelectorAll(ol, byTag('li'));
        assert.equal(steps.length, 3);

        for (let i = 0; i < 3; i++) {
          const step = steps[i];
          const desktopArrows = querySelectorAll(step, (node) => {
            const classes = getClasses(node);
            return (
              classes.includes('hidden') &&
              classes.includes('md:flex') &&
              classes.includes('absolute') &&
              classes.some((c) => c.includes('top-[28px]'))
            );
          });

          if (i < 2) {
            assert.equal(desktopArrows.length, 1, `[${lang}] Step ${i + 1} must have 1 desktop horizontal connector`);
            assert.equal(getTextContent(desktopArrows[0]).trim(), '→');
          } else {
            assert.equal(desktopArrows.length, 0, `[${lang}] Final Step 3 must NOT have an outbound connector`);
          }
        }
      }
    });

    it('T5-CON-STEP-03: Mobile Viewport (< 768px) vertical connectivity and downward connectors', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const procesoSection = getElementById(doc, 'proceso');
        const ol = querySelector(procesoSection, byTag('ol'));
        const steps = querySelectorAll(ol, byTag('li'));

        for (let i = 0; i < 3; i++) {
          const step = steps[i];
          const mobileConnectors = querySelectorAll(step, (node) => {
            const classes = getClasses(node);
            return (
              classes.includes('md:hidden') &&
              classes.includes('flex') &&
              classes.includes('items-center')
            );
          });

          if (i < 2) {
            assert.equal(mobileConnectors.length, 1, `[${lang}] Step ${i + 1} must contain 1 mobile vertical connector`);
            assert.equal(getTextContent(mobileConnectors[0]).trim(), '↓');
          } else {
            assert.equal(mobileConnectors.length, 0, `[${lang}] Final Step 3 must NOT contain an outbound mobile connector`);
          }
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // 2. FORM BOUNDARY STRESS TESTS & NETWORK SIMULATION
  // -------------------------------------------------------------------------
  describe('Form Boundary Stress Tests & Network Payload Resilience', () => {
    async function simulateFormSubmission({
      formDataValues,
      reportValidityResult = true,
      fetchImplementation,
      datasetLocale = 'es-MX',
    }) {
      const statusElement = {
        className: 'sm:col-span-2 min-h-5 text-xs text-fg-secondary',
        textContent: '',
      };

      const submitLabel = { textContent: 'Enviar mensaje' };
      const submitBtn = {
        disabled: false,
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = String(v); },
        removeAttribute(k) { delete this.attributes[k]; },
        querySelector(sel) {
          if (sel === '[data-submit-label]') return submitLabel;
          return null;
        },
      };

      const formElement = {
        dataset: {
          locale: datasetLocale,
          formError: 'Faltan campos obligatorios.',
          formLoading: 'Enviando…',
          formSuccess: 'Mensaje enviado correctamente.',
          formFailure: 'No se pudo enviar el mensaje. Inténtalo de nuevo.',
          formNetworkError: 'Error de conexión. Inténtalo de nuevo o escribe directamente.',
          ready: 'true',
        },
        reportValidity: () => reportValidityResult,
        resetCalled: false,
        reset() { this.resetCalled = true; },
      };

      const values = new Map(Object.entries(formDataValues));
      const getFormData = (k) => values.get(k);

      if (!formElement.reportValidity()) {
        return { abortedByBrowserValidity: true, statusElement, submitBtn, submitLabel };
      }

      const name = String(getFormData('name') ?? '').trim();
      const email = String(getFormData('email') ?? '').trim();
      const problem = String(getFormData('problem') ?? '').trim();
      const business = String(getFormData('business') ?? '').trim();
      const phone = String(getFormData('phone') ?? '').trim();
      const preferred = String(getFormData('preferred') ?? (formElement.dataset.locale === 'en' ? 'Email' : 'Correo'));
      const description = String(getFormData('problem') ?? '').trim();

      if (!name || !email || !problem) {
        statusElement.className = 'sm:col-span-2 min-h-5 text-xs text-amber-700 font-medium';
        statusElement.textContent = formElement.dataset.formError ?? 'Faltan campos obligatorios.';
        return {
          abortedEmptyValidation: true,
          statusElement,
          submitBtn,
          submitLabel,
          fetchCalled: false,
        };
      }

      const originalBtnText = submitLabel?.textContent ?? '';
      submitBtn.setAttribute('aria-busy', 'true');
      if (submitLabel) submitLabel.textContent = formElement.dataset.formLoading ?? 'Enviando…';
      submitBtn.disabled = true;
      statusElement.textContent = '';
      statusElement.className = 'sm:col-span-2 min-h-5 text-xs text-fg-secondary';

      let fetchPayload = null;
      try {
        const payload = {
          nombre: name,
          correo: email,
          negocio: business,
          telefono: phone,
          preferencia: preferred,
          descripcion: description,
          servicio: 'Consultoría',
          sitioWeb: String(getFormData('website') ?? ''),
          idioma: formElement.dataset.locale ?? 'es-MX',
        };
        fetchPayload = payload;

        const response = await fetchImplementation('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        await response.json().catch(() => null);
        if (response.ok) {
          formElement.reset();
          statusElement.className = 'sm:col-span-2 min-h-5 text-xs text-emerald-700 font-medium';
          statusElement.textContent = formElement.dataset.formSuccess ?? 'Mensaje enviado correctamente.';
        } else {
          statusElement.className = 'sm:col-span-2 min-h-5 text-xs text-amber-700 font-medium';
          statusElement.textContent = formElement.dataset.formFailure ?? 'No se pudo enviar el mensaje. Inténtalo de nuevo.';
        }
      } catch {
        statusElement.className = 'sm:col-span-2 min-h-5 text-xs text-amber-700 font-medium';
        statusElement.textContent = formElement.dataset.formNetworkError ?? 'Error de conexión. Inténtalo de nuevo o escribe directamente.';
      } finally {
        submitBtn.removeAttribute('aria-busy');
        if (submitLabel) submitLabel.textContent = originalBtnText;
        submitBtn.disabled = false;
      }

      return {
        abortedEmptyValidation: false,
        statusElement,
        submitBtn,
        submitLabel,
        fetchCalled: true,
        fetchPayload,
        formReset: formElement.resetCalled,
      };
    }

    it('T5-CON-FRM-01: Empty & whitespace-only form submissions are rejected without network request', async () => {
      let networkCalled = false;
      const dummyFetch = async () => { networkCalled = true; };

      const resA = await simulateFormSubmission({
        formDataValues: {},
        fetchImplementation: dummyFetch,
      });
      assert.equal(resA.abortedEmptyValidation, true);
      assert.equal(networkCalled, false);

      const resB = await simulateFormSubmission({
        formDataValues: { name: '   \t  \n ', email: '   ', problem: '      ' },
        fetchImplementation: dummyFetch,
      });
      assert.equal(resB.abortedEmptyValidation, true);
      assert.equal(networkCalled, false);
    });

    it('T5-CON-FRM-02: Backend and client handle oversized payloads (> 16KB limit) with HTTP 413 and graceful cleanup', async () => {
      const env = {
        RESEND_API_KEY: 'test-key',
        CONTACT_FROM_EMAIL: 'contacto@perdomopro.com',
        CONTACT_TO_EMAIL: 'owner@perdomopro.com',
      };
      const oversizedBody = 'x'.repeat(17 * 1024);
      const oversizedReq = new Request('https://perdomopro.com/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: oversizedBody,
      });

      const backendResult = await handleContact(oversizedReq, { error() {} }, { getEnv: (k) => env[k] });
      assert.equal(backendResult.status, 413);

      const clientRes = await simulateFormSubmission({
        formDataValues: { name: 'Test Large', email: 'large@example.com', problem: 'Large payload simulation' },
        fetchImplementation: async () => ({ ok: false, status: 413, json: async () => backendResult.jsonBody }),
      });

      assert.equal(clientRes.fetchCalled, true);
      assert.equal(clientRes.submitBtn.disabled, false);
      assert.equal(clientRes.submitBtn.attributes['aria-busy'], undefined);
    });

    it('T5-CON-FRM-03: Non-JSON server responses (HTML 502/504 gateway errors) are caught safely', async () => {
      const clientRes502 = await simulateFormSubmission({
        formDataValues: { name: 'Adrián', email: 'adrian@perdomopro.com', problem: 'Testing 502 gateway error' },
        fetchImplementation: async () => ({
          ok: false,
          status: 502,
          json: async () => { throw new SyntaxError('Unexpected token <'); },
        }),
      });

      assert.equal(clientRes502.fetchCalled, true);
      assert.equal(clientRes502.submitBtn.disabled, false);
      assert.equal(clientRes502.submitBtn.attributes['aria-busy'], undefined);
    });

    it('T5-CON-FRM-04: Non-JSON payload on HTTP 200 is safely parsed without breaking form success', async () => {
      const clientRes = await simulateFormSubmission({
        formDataValues: { name: 'Adrián', email: 'adrian@perdomopro.com', problem: 'Testing 200 OK' },
        fetchImplementation: async () => ({
          ok: true,
          status: 200,
          json: async () => { throw new SyntaxError('Unexpected token O'); },
        }),
      });

      assert.equal(clientRes.formReset, true);
      assert.ok(clientRes.statusElement.className.includes('text-emerald-700'));
    });

    it('T5-CON-FRM-05: Network transport exceptions (offline / DNS failure) are captured with accessible feedback', async () => {
      const clientRes = await simulateFormSubmission({
        formDataValues: { name: 'Adrián', email: 'adrian@perdomopro.com', problem: 'Testing network disconnect' },
        fetchImplementation: async () => { throw new TypeError('Failed to fetch'); },
      });

      assert.equal(clientRes.submitBtn.disabled, false);
      assert.equal(clientRes.submitBtn.attributes['aria-busy'], undefined);
      assert.ok(clientRes.statusElement.className.includes('text-amber-700'));
    });

    it('T5-CON-FRM-06: Honeypot anti-spam field is concealed from assistive tech and handled silently by backend', async () => {
      assert.ok(docEs, 'dist/consultoria/index.html must exist');
      const form = getElementById(docEs, 'consulting-contact-form');
      assert.ok(form, '#consulting-contact-form must exist');

      const honeypotInput = querySelector(form, byAttr('name', 'website'));
      assert.ok(honeypotInput, 'Honeypot input name="website" must exist');
      assert.equal(getAttribute(honeypotInput, 'tabindex'), '-1');

      const honeypotLabel = querySelector(form, (node) => {
        return node.tagName === 'label' && getClasses(node).includes('sr-only') && getAttribute(node, 'aria-hidden') === 'true';
      });
      assert.ok(honeypotLabel, 'Honeypot input must be enclosed in label.sr-only[aria-hidden="true"]');

      let emailSent = false;
      const env = {
        RESEND_API_KEY: 'test-key',
        CONTACT_FROM_EMAIL: 'contacto@perdomopro.com',
        CONTACT_TO_EMAIL: 'owner@perdomopro.com',
      };
      const honeypotReq = new Request('https://perdomopro.com/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Spam Bot',
          correo: 'bot@spam.com',
          descripcion: 'Buy cheap items',
          sitioWeb: 'https://spamsite.xyz',
        }),
      });

      const honeypotResult = await handleContact(honeypotReq, { error() {} }, {
        getEnv: (k) => env[k],
        sendEmail: async () => { emailSent = true; },
      });

      assert.equal(honeypotResult.status, 200);
      assert.equal(emailSent, false);
    });

    it('T5-CON-FRM-07: Form script includes re-entrancy and duplicate listener guard (data-ready="true")', () => {
      assert.match(
        consultingSource,
        /if \(!form \|\| !status \|\| !submitBtn \|\| form\.dataset\.ready === 'true'\) return;/
      );
      assert.match(consultingSource, /form\.dataset\.ready = 'true';/);
      assert.match(consultingSource, /document\.addEventListener\('astro:page-load', setupConsultingForm\);/);
    });
  });

  // -------------------------------------------------------------------------
  // 3. CARD LAYOUT CONSISTENCY ACROSS ALL 5 SECTIONS
  // -------------------------------------------------------------------------
  describe('Card Layout Consistency Stress Tests', () => {
    it('T5-CON-LAY-01: Hero (#inicio-consultoria) features 3 quick business guarantees in both ES and EN', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const hero = getElementById(doc, 'inicio-consultoria');
        assert.ok(hero, `[${lang}] #inicio-consultoria must exist`);
        const guaranteeList = querySelector(hero, byAttr('data-hero-guarantees'));
        assert.ok(guaranteeList, `[${lang}] Hero must contain [data-hero-guarantees]`);
        const items = querySelectorAll(guaranteeList, byTag('li'));
        assert.equal(items.length, 3, `[${lang}] Hero must show 3 quick guarantees`);
      }
    });

    it('T5-CON-LAY-02: Exactly 4 Unified Pain+Solution+Outcome cards in #soluciones (2x2 grid) with .transition-card', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const soluciones = getElementById(doc, 'soluciones');
        assert.ok(soluciones, `[${lang}] #soluciones section must exist`);

        const articles = querySelectorAll(soluciones, byTag('article'));
        assert.equal(articles.length, 4, `[${lang}] #soluciones must contain 4 unified cards`);

        articles.forEach((article, i) => {
          const classes = getClasses(article);
          assert.ok(classes.includes('transition-card'), `[${lang}] Solution card ${i + 1} must use .transition-card`);
          const text = getTextContent(article);
          assert.ok(text.includes(`0${i + 1}`), `[${lang}] Card ${i + 1} must display index 0${i + 1}`);
          const lis = querySelectorAll(article, byTag('li'));
          assert.equal(lis.length, 3, `[${lang}] Card ${i + 1} must list 3 concise business bullets`);
        });
      }
    });

    it('T5-CON-LAY-03: Exactly 3 Contracting Model tier cards, Sovereignty block, and 4 FAQs in #modalidades', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const modalidades = getElementById(doc, 'modalidades');
        assert.ok(modalidades, `[${lang}] Section must have id="modalidades"`);

        const articles = querySelectorAll(modalidades, byTag('article'));
        assert.equal(articles.length, 3, `[${lang}] #modalidades must contain 3 contracting tier cards`);

        articles.forEach((article, i) => {
          const listItems = querySelectorAll(article, byTag('li'));
          assert.equal(listItems.length, 4, `[${lang}] Tier ${i + 1} must list 4 inclusion items`);
        });

        const faq = getElementById(doc, 'faq');
        assert.ok(faq, `[${lang}] #faq anchor must exist inside #modalidades`);
        const details = querySelectorAll(faq, byTag('details'));
        assert.equal(details.length, 4, `[${lang}] #faq must contain strictly 4 operational questions`);
      }
    });

    it('T5-CON-LAY-04: Section anchors, Navbar links, and unique IDs across all consulting page sections', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const requiredSectionIds = [
          'inicio-consultoria',
          'soluciones',
          'proceso',
          'modalidades',
          'faq',
          'contacto',
        ];

        for (const id of requiredSectionIds) {
          const el = getElementById(doc, id);
          assert.ok(el, `[${lang}] Required id="${id}" must exist in DOM`);
        }

        // Verify Navbar links match new architecture
        const header = getElementById(doc, 'site-header');
        const navHrefs = querySelectorAll(header, byTag('a')).map((a) => getAttribute(a, 'href'));
        assert.ok(navHrefs.includes('#soluciones'), `[${lang}] Navbar must link to #soluciones`);
        assert.ok(navHrefs.includes('#proceso'), `[${lang}] Navbar must link to #proceso`);
        assert.ok(navHrefs.includes('#modalidades'), `[${lang}] Navbar must link to #modalidades`);
        assert.ok(navHrefs.includes('#faq'), `[${lang}] Navbar must link to #faq`);
        assert.ok(navHrefs.includes('#contacto'), `[${lang}] Navbar must link to #contacto`);
        assert.ok(!navHrefs.includes('#problemas'), `[${lang}] Navbar must NOT link to removed #problemas`);
        assert.ok(!navHrefs.includes('#proyectos'), `[${lang}] Navbar must NOT link to removed #proyectos`);

        // Verify ID uniqueness
        const allElementsWithId = querySelectorAll(doc, (node) => hasAttribute(node, 'id'));
        const seenIds = new Set();
        for (const el of allElementsWithId) {
          const id = getAttribute(el, 'id');
          assert.ok(!seenIds.has(id), `[${lang}] Duplicate element id detected in DOM: #${id}`);
          seenIds.add(id);
        }
      }
    });
  });
});
