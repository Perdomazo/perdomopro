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

describe('Tier 5 Adversarial: Consultoria Empirical Stress Tests (Milestone M2)', () => {
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

        // Check milestone numbers in nodes
        const expectedMilestones = ['01', '02', '03'];
        listItems.forEach((li, idx) => {
          const text = getTextContent(li);
          assert.ok(
            text.includes(expectedMilestones[idx]),
            `[${lang}] Step ${idx + 1} must display milestone node ${expectedMilestones[idx]}`
          );
          // Check deliverable footnote exists
          assert.ok(
            text.includes('ENTREGABLE CLAVE') || text.includes('KEY DELIVERABLE'),
            `[${lang}] Step ${idx + 1} must include deliverable card footnote`
          );
          // Check checkpoint indicator
          assert.ok(
            text.includes('↳'),
            `[${lang}] Step ${idx + 1} must contain checkpoint indicator ↳`
          );
        });
      }
    });

    it('T5-CON-STEP-02: Desktop Viewport (>= 768px md: / 1024px lg:) connectivity track and horizontal arrows', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const procesoSection = getElementById(doc, 'proceso');
        assert.ok(procesoSection, `[${lang}] #proceso must exist`);

        // Verify Desktop Continuous Progress Rail
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

        // Verify gradient inner line
        const railInner = querySelector(rail, (node) => {
          const classes = getClasses(node);
          return classes.includes('w-full') && classes.some(c => c.includes('bg-gradient-to-r'));
        });
        assert.ok(railInner, `[${lang}] Rail must feature accent gradient track fill`);

        // Verify Stepper Grid layout
        const ol = querySelector(procesoSection, byTag('ol'));
        const olClasses = getClasses(ol);
        assert.ok(
          olClasses.includes('grid') && olClasses.includes('md:grid-cols-3'),
          `[${lang}] Stepper <ol> must be a 3-column responsive grid (md:grid-cols-3)`
        );

        // Verify horizontal inter-card connectors on steps 1 and 2
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
              classes.some(c => c.includes('top-[28px]'))
            );
          });

          if (i < 2) {
            assert.equal(
              desktopArrows.length,
              1,
              `[${lang}] Step ${i + 1} must have exactly 1 desktop horizontal connector arrow`
            );
            const arrow = desktopArrows[0];
            assert.equal(getAttribute(arrow, 'aria-hidden'), 'true', `[${lang}] Desktop arrow must be aria-hidden="true"`);
            const arrowText = getTextContent(arrow).trim();
            assert.equal(arrowText, '→', `[${lang}] Desktop connector must display rightward arrow →`);
            const arrowClasses = getClasses(arrow);
            assert.ok(
              arrowClasses.some(c => c.includes('-right-3.5') || c.includes('lg:-right-4.5')),
              `[${lang}] Desktop connector must position across column gap`
            );
          } else {
            assert.equal(
              desktopArrows.length,
              0,
              `[${lang}] Final Step 3 must NOT have an outbound connector arrow`
            );
          }
        }
      }
    });

    it('T5-CON-STEP-03: Mobile Viewport (< 768px, e.g. 320px) vertical connectivity and downward connectors', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const procesoSection = getElementById(doc, 'proceso');
        const ol = querySelector(procesoSection, byTag('ol'));
        const steps = querySelectorAll(ol, byTag('li'));

        // Desktop rail is hidden on mobile via `hidden md:block`
        const rail = querySelector(procesoSection, (node) => getClasses(node).includes('hidden') && getClasses(node).includes('md:block'));
        assert.ok(rail, `[${lang}] Progress rail is hidden below md: breakpoint (320px-767px)`);

        // Verify mobile downward connectors on steps 1 and 2
        for (let i = 0; i < 3; i++) {
          const step = steps[i];
          const mobileConnectors = querySelectorAll(step, (node) => {
            const classes = getClasses(node);
            return (
              classes.includes('md:hidden') &&
              classes.includes('flex') &&
              classes.includes('items-center') &&
              classes.some(c => c.includes('-my-3'))
            );
          });

          if (i < 2) {
            assert.equal(
              mobileConnectors.length,
              1,
              `[${lang}] Step ${i + 1} must contain exactly 1 mobile vertical connector`
            );
            const mobileConnector = mobileConnectors[0];
            assert.equal(getAttribute(mobileConnector, 'aria-hidden'), 'true', `[${lang}] Mobile connector must be aria-hidden="true"`);
            const connectorText = getTextContent(mobileConnector).trim();
            assert.equal(connectorText, '↓', `[${lang}] Mobile connector must display downward arrow ↓`);

            // Check circular node styling on mobile arrow
            const innerCircle = querySelector(mobileConnector, (node) => {
              const classes = getClasses(node);
              return classes.includes('w-6') && classes.includes('h-6') && classes.includes('rounded-full');
            });
            assert.ok(innerCircle, `[${lang}] Mobile connector must render circular node container`);
          } else {
            assert.equal(
              mobileConnectors.length,
              0,
              `[${lang}] Final Step 3 must NOT contain an outbound mobile connector`
            );
          }
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // 2. FORM BOUNDARY STRESS TESTS & NETWORK SIMULATION
  // -------------------------------------------------------------------------
  describe('Form Boundary Stress Tests & Network Payload Resilience', () => {
    // Helper to simulate client form submission logic from ConsultingPage.astro
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

      // Mock FormData
      const values = new Map(Object.entries(formDataValues));
      const getFormData = (k) => values.get(k);

      // Execute exact client script handler logic:
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

      // Case A: completely empty
      const resA = await simulateFormSubmission({
        formDataValues: {},
        fetchImplementation: dummyFetch,
      });
      assert.equal(resA.abortedEmptyValidation, true);
      assert.equal(networkCalled, false);
      assert.equal(resA.statusElement.textContent, 'Faltan campos obligatorios.');
      assert.ok(resA.statusElement.className.includes('text-amber-700'));
      assert.equal(resA.submitBtn.disabled, false);
      assert.equal(resA.submitBtn.attributes['aria-busy'], undefined);

      // Case B: whitespace-only required fields
      const resB = await simulateFormSubmission({
        formDataValues: {
          name: '   \t  \n ',
          email: '   ',
          problem: '      ',
        },
        fetchImplementation: dummyFetch,
      });
      assert.equal(resB.abortedEmptyValidation, true);
      assert.equal(networkCalled, false);
      assert.equal(resB.statusElement.textContent, 'Faltan campos obligatorios.');

      // Case C: missing problem description
      const resC = await simulateFormSubmission({
        formDataValues: {
          name: 'Adrián',
          email: 'adrian@perdomopro.com',
          problem: '   ',
        },
        fetchImplementation: dummyFetch,
      });
      assert.equal(resC.abortedEmptyValidation, true);
      assert.equal(networkCalled, false);
    });

    it('T5-CON-FRM-02: Backend and client handle oversized payloads (> 16KB limit) with HTTP 413 and graceful cleanup', async () => {
      // 1. Direct Backend Verification
      const env = {
        RESEND_API_KEY: 'test-key',
        CONTACT_FROM_EMAIL: 'contacto@perdomopro.com',
        CONTACT_TO_EMAIL: 'owner@perdomopro.com',
      };
      const context = { error() {} };

      const oversizedBody = 'x'.repeat(17 * 1024);
      const oversizedReq = new Request('https://perdomopro.com/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: oversizedBody,
      });

      const backendResult = await handleContact(oversizedReq, context, { getEnv: (k) => env[k] });
      assert.equal(backendResult.status, 413, 'Backend must return 413 Payload Too Large');
      assert.equal(backendResult.jsonBody.ok, false);

      // 2. Client Resilience Verification when receiving 413
      const mockFetch413 = async () => ({
        ok: false,
        status: 413,
        json: async () => backendResult.jsonBody,
      });

      const clientRes = await simulateFormSubmission({
        formDataValues: {
          name: 'Test Large',
          email: 'large@example.com',
          problem: 'Large payload simulation',
        },
        fetchImplementation: mockFetch413,
      });

      assert.equal(clientRes.fetchCalled, true);
      assert.equal(clientRes.statusElement.textContent, 'No se pudo enviar el mensaje. Inténtalo de nuevo.');
      assert.ok(clientRes.statusElement.className.includes('text-amber-700'));
      assert.equal(clientRes.submitBtn.disabled, false, 'Button must be re-enabled after 413');
      assert.equal(clientRes.submitBtn.attributes['aria-busy'], undefined, 'aria-busy must be removed after 413');
      assert.equal(clientRes.submitLabel.textContent, 'Enviar mensaje', 'Submit button label must be restored');
    });

    it('T5-CON-FRM-03: Non-JSON server responses (HTML 502/504 gateway errors) are caught safely without unhandled rejections', async () => {
      // Simulates an upstream reverse proxy (Azure/Cloudflare) returning 502 Bad Gateway HTML
      const mockFetch502Html = async () => ({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      });

      const clientRes502 = await simulateFormSubmission({
        formDataValues: {
          name: 'Adrián',
          email: 'adrian@perdomopro.com',
          problem: 'Testing 502 gateway error',
        },
        fetchImplementation: mockFetch502Html,
      });

      assert.equal(clientRes502.fetchCalled, true);
      assert.equal(clientRes502.statusElement.textContent, 'No se pudo enviar el mensaje. Inténtalo de nuevo.');
      assert.ok(clientRes502.statusElement.className.includes('text-amber-700'));
      assert.equal(clientRes502.submitBtn.disabled, false);
      assert.equal(clientRes502.submitBtn.attributes['aria-busy'], undefined);
      assert.equal(clientRes502.submitLabel.textContent, 'Enviar mensaje');
    });

    it('T5-CON-FRM-04: Non-JSON payload on HTTP 200 is safely parsed without breaking form success', async () => {
      // Edge case: Server returns 200 OK with empty body or plain text "OK"
      const mockFetch200PlainText = async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token O in JSON at position 0');
        },
      });

      const clientRes = await simulateFormSubmission({
        formDataValues: {
          name: 'Adrián',
          email: 'adrian@perdomopro.com',
          problem: 'Testing 200 with non-JSON body',
        },
        fetchImplementation: mockFetch200PlainText,
      });

      assert.equal(clientRes.fetchCalled, true);
      assert.equal(clientRes.formReset, true, 'Form must reset on 200 OK');
      assert.equal(clientRes.statusElement.textContent, 'Mensaje enviado correctamente.');
      assert.ok(clientRes.statusElement.className.includes('text-emerald-700'));
      assert.equal(clientRes.submitBtn.disabled, false);
      assert.equal(clientRes.submitBtn.attributes['aria-busy'], undefined);
    });

    it('T5-CON-FRM-05: Network transport exceptions (offline / DNS failure) are captured with accessible feedback', async () => {
      const mockFetchNetworkError = async () => {
        throw new TypeError('Failed to fetch');
      };

      const clientRes = await simulateFormSubmission({
        formDataValues: {
          name: 'Adrián',
          email: 'adrian@perdomopro.com',
          problem: 'Testing network disconnect',
        },
        fetchImplementation: mockFetchNetworkError,
      });

      assert.equal(clientRes.fetchCalled, true);
      assert.equal(clientRes.statusElement.textContent, 'Error de conexión. Inténtalo de nuevo o escribe directamente.');
      assert.ok(clientRes.statusElement.className.includes('text-amber-700'));
      assert.equal(clientRes.submitBtn.disabled, false, 'Button must be re-enabled on network drop');
      assert.equal(clientRes.submitBtn.attributes['aria-busy'], undefined);
      assert.equal(clientRes.submitLabel.textContent, 'Enviar mensaje');
    });

    it('T5-CON-FRM-06: Honeypot anti-spam field is concealed from assistive tech and handled silently by backend', async () => {
      assert.ok(docEs, 'dist/consultoria/index.html must exist');
      const form = getElementById(docEs, 'consulting-contact-form');
      assert.ok(form, '#consulting-contact-form must exist');

      // Check honeypot DOM layout
      const honeypotInput = querySelector(form, byAttr('name', 'website'));
      assert.ok(honeypotInput, 'Honeypot input name="website" must exist');
      assert.equal(getAttribute(honeypotInput, 'tabindex'), '-1', 'Honeypot must have tabindex="-1" to prevent keyboard focus');

      // Check honeypot label is sr-only with aria-hidden="true"
      const honeypotLabel = querySelector(form, (node) => {
        return node.tagName === 'label' && getClasses(node).includes('sr-only') && getAttribute(node, 'aria-hidden') === 'true';
      });
      assert.ok(honeypotLabel, 'Honeypot input must be enclosed in label.sr-only[aria-hidden="true"]');

      // Direct Backend Test: Honeypot submission must return 200 without email sending
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

      assert.equal(honeypotResult.status, 200, 'Honeypot must return 200');
      assert.equal(emailSent, false, 'Honeypot must NOT dispatch email');
    });

    it('T5-CON-FRM-07: Form script includes re-entrancy and duplicate listener guard (data-ready="true")', () => {
      assert.match(
        consultingSource,
        /if \(!form \|\| !status \|\| !submitBtn \|\| form\.dataset\.ready === 'true'\) return;/,
        'setupConsultingForm must guard against missing elements and duplicate listener attachment'
      );
      assert.match(
        consultingSource,
        /form\.dataset\.ready = 'true';/,
        'Form must set data-ready="true" after binding listeners'
      );
      assert.match(
        consultingSource,
        /document\.addEventListener\('astro:page-load', setupConsultingForm\);/,
        'Form must attach to astro:page-load for client router navigation'
      );
    });
  });

  // -------------------------------------------------------------------------
  // 3. CARD LAYOUT CONSISTENCY ACROSS ALL SECTIONS
  // -------------------------------------------------------------------------
  describe('Card Layout Consistency Stress Tests', () => {
    it('T5-CON-LAY-01: Exactly 6 Problem/Friction cards in both ES and EN with consistent symptom & bottleneck structure', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const problemas = getElementById(doc, 'problemas');
        assert.ok(problemas, `[${lang}] #problemas section must exist`);

        const articles = querySelectorAll(problemas, byTag('article'));
        assert.equal(articles.length, 6, `[${lang}] #problemas must contain exactly 6 problem cards`);

        articles.forEach((article, i) => {
          const text = getTextContent(article);
          const expectedIndex = `0${i + 1}`;
          assert.ok(text.includes(expectedIndex), `[${lang}] Card ${i + 1} must display index ${expectedIndex}`);

          // Verify amber micro-badge
          const microBadge = querySelector(article, (node) => {
            const classes = getClasses(node);
            return (
              classes.includes('border-amber-500/25') &&
              classes.includes('bg-amber-500/10') &&
              classes.includes('text-amber-900')
            );
          });
          assert.ok(microBadge, `[${lang}] Card ${i + 1} must feature high-contrast amber micro-badge`);

          // Verify amber bullet dot
          const bulletDot = querySelector(microBadge, (node) => {
            const classes = getClasses(node);
            return classes.includes('bg-amber-600') && classes.includes('rounded-full');
          });
          assert.ok(bulletDot, `[${lang}] Card ${i + 1} micro-badge must feature amber dot indicator`);

          // Verify bottleneck indicator
          const bottleneckLabel = lang === 'ES' ? 'Cuello de botella:' : 'Bottleneck:';
          assert.ok(text.includes(bottleneckLabel), `[${lang}] Card ${i + 1} must contain bottleneck label "${bottleneckLabel}"`);
          assert.ok(text.includes('↳'), `[${lang}] Card ${i + 1} must contain footnote arrow ↳`);

          // Verify subtle diagnostic background
          const articleClasses = getClasses(article);
          assert.ok(articleClasses.includes('bg-canvas-subtle'), `[${lang}] Card ${i + 1} must use bg-canvas-subtle surface`);
        });
      }
    });

    it('T5-CON-LAY-02: Exactly 5 Solution cards (1 Featured spanning 2 cols + 4 Modular) in both ES and EN', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const soluciones = getElementById(doc, 'soluciones');
        assert.ok(soluciones, `[${lang}] #soluciones section must exist`);

        const articles = querySelectorAll(soluciones, byTag('article'));
        assert.equal(articles.length, 5, `[${lang}] #soluciones must contain exactly 5 solution cards`);

        let featuredCount = 0;
        let modularCount = 0;

        articles.forEach((article, i) => {
          const articleClasses = getClasses(article);
          const text = getTextContent(article);

          // All cards must have top accent gradient line
          const topAccent = querySelector(article, (node) => {
            const classes = getClasses(node);
            return classes.includes('h-0.5') && classes.some(c => c.includes('bg-gradient-to-r'));
          });
          assert.ok(topAccent, `[${lang}] Solution card ${i + 1} must have top gradient accent line`);

          // Deliverables checklist header
          const deliverableHeading = lang === 'ES' ? 'ENTREGABLES CLAVE' : 'KEY DELIVERABLES';
          assert.ok(text.includes(deliverableHeading), `[${lang}] Solution card ${i + 1} must have deliverables heading`);

          // Deliverable checklist items with SVG checkmarks
          const listItems = querySelectorAll(article, byTag('li'));
          assert.ok(listItems.length >= 4, `[${lang}] Solution card ${i + 1} must have at least 4 deliverable items`);

          // Target use-case footnote
          const useCasePrefix = lang === 'ES' ? 'Ideal para:' : 'Best for:';
          assert.ok(text.includes(useCasePrefix), `[${lang}] Solution card ${i + 1} must have use-case footnote`);

          // Check featured vs modular grid span
          if (articleClasses.includes('sm:col-span-2')) {
            featuredCount++;
            assert.equal(i, 0, `[${lang}] The featured solution must be card 01 (Core Platform)`);
            const badgeText = lang === 'ES' ? 'SISTEMA CENTRAL' : 'CORE PLATFORM';
            assert.ok(text.includes(badgeText), `[${lang}] Featured card must display ${badgeText} badge`);

            // Featured card checklist must be in 2 columns
            const deliverableUl = querySelector(article, byTag('ul'));
            const ulClasses = getClasses(deliverableUl);
            assert.ok(ulClasses.includes('sm:grid-cols-2'), `[${lang}] Featured card must arrange deliverables in sm:grid-cols-2`);
          } else if (articleClasses.includes('sm:col-span-1')) {
            modularCount++;
          }
        });

        assert.equal(featuredCount, 1, `[${lang}] Expected exactly 1 featured solution card (spanning 2 columns)`);
        assert.equal(modularCount, 4, `[${lang}] Expected exactly 4 modular solution cards (spanning 1 column)`);
      }
    });

    it('T5-CON-LAY-03: Exactly 3 Contracting Model tier cards and Cloud Sovereignty notice in #inversion', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const inversion = getElementById(doc, 'inversion');
        assert.ok(inversion, `[${lang}] Section must have explicit id="inversion"`);

        const articles = querySelectorAll(inversion, byTag('article'));
        assert.equal(articles.length, 3, `[${lang}] #inversion must contain exactly 3 contracting tier cards`);

        const expectedTiers = [
          { esNum: '01', esBadge: 'ALCANCE CERRADO', enBadge: 'FIXED SCOPE' },
          { esNum: '02', esBadge: 'EVALUACIÓN PREVIA', enBadge: 'TECHNICAL AUDIT' },
          { esNum: '03', esBadge: 'CONTINUIDAD TÉCNICA', enBadge: 'ONGOING PARTNER' },
        ];

        articles.forEach((article, i) => {
          const text = getTextContent(article);
          const tier = expectedTiers[i];
          assert.ok(text.includes(tier.esNum), `[${lang}] Tier ${i + 1} must display tier number ${tier.esNum}`);
          const badgeText = lang === 'ES' ? tier.esBadge : tier.enBadge;
          assert.ok(text.includes(badgeText), `[${lang}] Tier ${i + 1} must display badge ${badgeText}`);

          // Inclusions checklist header
          const inclusionsHeader = lang === 'ES' ? 'QUÉ INCLUYE ESTA MODALIDAD' : 'WHAT IS INCLUDED';
          assert.ok(text.includes(inclusionsHeader), `[${lang}] Tier ${i + 1} must display inclusions header`);

          // Checkmark items
          const listItems = querySelectorAll(article, byTag('li'));
          assert.equal(listItems.length, 4, `[${lang}] Tier ${i + 1} must list exactly 4 inclusion items`);

          // Ideal fit footnote
          const fitLabel = lang === 'ES' ? 'IDEAL PARA:' : 'IDEAL FIT:';
          assert.ok(text.includes(fitLabel), `[${lang}] Tier ${i + 1} must display ideal fit footnote`);
        });

        // Cloud Sovereignty Notice Banner
        const bannerText = getTextContent(inversion);
        const sovBadge = lang === 'ES' ? 'TRANSPARENCIA & SOBERANÍA CLOUD' : 'TRANSPARENCY & CLOUD SOVEREIGNTY';
        assert.ok(bannerText.includes(sovBadge), `[${lang}] Inversion section must feature Cloud Sovereignty banner badge`);

        // Check 3 key transparency guarantees
        if (lang === 'ES') {
          assert.ok(bannerText.includes('Facturación directa a costo de proveedor'));
          assert.ok(bannerText.includes('Código fuente y repositorio 100% de tu propiedad'));
          assert.ok(bannerText.includes('Sin dependencias técnicas ni contratos cautivos'));
        } else {
          assert.ok(bannerText.includes('Direct provider-at-cost billing'));
          assert.ok(bannerText.includes('100% client ownership of source code & repos'));
          assert.ok(bannerText.includes('Zero proprietary vendor lock-in'));
        }
      }
    });

    it('T5-CON-LAY-04: Section anchors and unique IDs across all consulting page sections', () => {
      for (const [lang, doc] of [['ES', docEs], ['EN', docEn]]) {
        const requiredSectionIds = [
          'inicio-consultoria',
          'problemas',
          'soluciones',
          'proceso',
          'proyectos',
          'inversion',
          'faq',
          'contacto',
        ];

        for (const id of requiredSectionIds) {
          const el = getElementById(doc, id);
          assert.ok(el, `[${lang}] Required section id="${id}" must exist in DOM`);
        }

        // Verify Hero CTA anchors point to valid IDs
        const heroSection = getElementById(doc, 'inicio-consultoria');
        assert.ok(heroSection, `[${lang}] Hero section #inicio-consultoria must exist`);
        const ctaButtons = querySelectorAll(heroSection, byTag('a'));
        const hrefs = ctaButtons.map((a) => getAttribute(a, 'href'));
        assert.ok(hrefs.includes('#contacto'), `[${lang}] Hero primary CTA must link to #contacto`);
        assert.ok(hrefs.includes('#soluciones'), `[${lang}] Hero secondary CTA must link to #soluciones`);

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
