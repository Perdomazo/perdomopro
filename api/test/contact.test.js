const test = require("node:test");
const assert = require("node:assert/strict");
const { handleContact } = require("../src/functions/contact");

const env = {
  RESEND_API_KEY: "test-key",
  CONTACT_FROM_EMAIL: "contacto@example.com",
  CONTACT_TO_EMAIL: "owner@example.com",
};
const context = { error() {} };
const request = (body, headers = { "content-type": "application/json" }) => new Request("https://example.test/api/contact", {
  method: "POST",
  headers,
  body: typeof body === "string" ? body : JSON.stringify(body),
});
const valid = { nombre: "Adrián", correo: "visitor@example.com", descripcion: "Quiero mejorar mis pedidos." };
const getEnv = (key) => env[key];

test("rejects malformed and incomplete submissions", async () => {
  assert.equal((await handleContact(request("{"), context, { getEnv })).status, 400);
  assert.equal((await handleContact(request({ nombre: "A" }), context, { getEnv })).status, 400);
  assert.equal((await handleContact(request({ ...valid, correo: "no-email" }), context, { getEnv })).status, 400);
});

test("rejects oversized requests and non-JSON bodies", async () => {
  assert.equal((await handleContact(request(valid, { "content-type": "text/plain" }), context, { getEnv })).status, 415);
  const large = request(valid, { "content-type": "application/json", "content-length": "20000" });
  assert.equal((await handleContact(large, context, { getEnv })).status, 413);
});

test("honeypot submissions are accepted without sending email", async () => {
  let sent = false;
  const result = await handleContact(request({ ...valid, sitioWeb: "bot" }), context, {
    getEnv,
    sendEmail: async () => { sent = true; },
  });
  assert.equal(result.status, 200);
  assert.equal(sent, false);
});

test("sends escaped content, reply-to, and optional contact details", async () => {
  let message;
  const result = await handleContact(request({
    ...valid,
    nombre: "<script>alert(1)</script>",
    telefono: "+52 33 1234 5678",
    preferencia: "Phone",
  }), context, { getEnv, sendEmail: async (value) => { message = value; return { data: { id: "local-test" } }; } });
  assert.equal(result.status, 200);
  assert.equal(message.replyTo, valid.correo);
  assert.match(message.html, /&lt;script&gt;/);
  assert.match(message.html, /\+52 33 1234 5678/);
  assert.doesNotMatch(message.html, /<script>/);
  assert.equal(message.from, env.CONTACT_FROM_EMAIL);
  assert.equal(message.to, env.CONTACT_TO_EMAIL);
});

test("fails closed when Resend settings are missing", async () => {
  let sent = false;
  const errors = [];
  const result = await handleContact(request(valid), { error: (message) => errors.push(message) }, {
    getEnv: (key) => key === "RESEND_API_KEY" ? "private-test-value" : undefined,
    sendEmail: async () => { sent = true; },
  });
  assert.equal(result.status, 503);
  assert.equal(sent, false);
  assert.match(errors[0], /CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL/);
  assert.doesNotMatch(errors[0], /private-test-value/);
});

test("does not expose provider errors to the visitor", async () => {
  const result = await handleContact(request(valid), context, { getEnv, sendEmail: async () => { throw new Error("secret provider detail"); } });
  assert.equal(result.status, 502);
  assert.doesNotMatch(result.jsonBody.message, /secret provider detail/);
});
