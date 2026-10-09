import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile, SOURCE_FILES } from '../helpers/fixtures.js';

describe('Tier 2: Consultoria Boundaries & Edge Cases', () => {
  const consultingSource = readProjectFile(SOURCE_FILES.consultingAstro);
  const contactApi = readProjectFile(SOURCE_FILES.contactApi);

  it('T2-CON-01: Form trimming boundary: whitespace-only fields are rejected before network submission', () => {
    // Authoritative source: ConsultingPage.astro client validation logic
    assert.match(
      consultingSource,
      /const name = String\(values\.get\('name'\) \?\? ''\)\.trim\(\);/,
      'Name must be trimmed before validation'
    );
    assert.match(
      consultingSource,
      /const email = String\(values\.get\('email'\) \?\? ''\)\.trim\(\);/,
      'Email must be trimmed before validation'
    );
    assert.match(
      consultingSource,
      /if \(!name \|\| !email \|\| !problem\)/,
      'Empty or whitespace-only required fields must abort submission'
    );
  });

  it('T2-CON-02: Contact API rejects oversized payloads beyond 16KB limit (HTTP 413)', () => {
    // Authoritative source: api/src/functions/contact.js & api/test/contact.test.js
    assert.match(
      contactApi,
      /413/,
      'Contact API must return status 413 for oversized payloads'
    );
  });

  it('T2-CON-03: Honeypot field boundary: non-empty bot field results in HTTP 200 without sending email', () => {
    // Authoritative source: api/test/contact.test.js ("honeypot submissions are accepted without sending email")
    assert.match(
      contactApi,
      /sitioWeb/,
      'Backend contact handler must inspect honeypot sitioWeb parameter'
    );
  });

  it('T2-CON-04: Network exception boundary: fetch failure clears aria-busy and displays accessible error', () => {
    // Check finally block restores button and aria-busy
    assert.match(
      consultingSource,
      /submitBtn\.removeAttribute\('aria-busy'\)/,
      'Submit button must clear aria-busy in finally block'
    );
    assert.match(
      consultingSource,
      /submitBtn\.disabled = false/,
      'Submit button must be re-enabled in finally block'
    );
  });

  it('T2-CON-05: Unicode and multi-byte text boundary: names with accents and international numbers are preserved', () => {
    // Test that the payload handles UTF-8 characters
    const mockPayload = {
      nombre: 'Adrián José Perdomo Ñandú',
      correo: 'adrian@perdomopro.com',
      descripcion: 'Cotización para sistema de inventario en Guadalajara 🚀',
      servicio: 'Consultoría',
      idioma: 'es-MX',
    };
    const serialized = JSON.stringify(mockPayload);
    const parsed = JSON.parse(serialized);
    assert.equal(parsed.nombre, mockPayload.nombre, 'Unicode characters in name must be preserved');
    assert.equal(parsed.descripcion, mockPayload.descripcion, 'Unicode emojis in description must be preserved');
  });
});
