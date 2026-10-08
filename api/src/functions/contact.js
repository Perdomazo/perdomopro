const { app } = require("@azure/functions");
const { Resend } = require("resend");

const MAX_BODY_BYTES = 16 * 1024;
const MAX_LENGTHS = {
  nombre: 120,
  correo: 254,
  negocio: 160,
  telefono: 40,
  preferencia: 30,
  descripcion: 5000,
  servicio: 120,
  idioma: 10,
  sitioWeb: 200,
};

const response = (status, message) => ({ status, jsonBody: { ok: status >= 200 && status < 300, message } });
const text = (value, maxLength) => (typeof value === "string" ? value.trim().slice(0, maxLength) : "");
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

async function handleContact(request, context, { getEnv = (key) => process.env[key], sendEmail } = {}) {
  if (request.method !== "POST") return response(405, "Method not allowed.");
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return response(415, "Unsupported content type.");
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return response(413, "Request is too large.");

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return response(400, "Invalid request.");
  }
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) return response(413, "Request is too large.");

  let input;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return response(400, "Invalid request.");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return response(400, "Invalid request.");

  // Quietly accept automated submissions without sending email.
  if (typeof input.sitioWeb === "string" && input.sitioWeb.trim()) return response(200, "Message received.");

  const fields = Object.fromEntries(Object.entries(MAX_LENGTHS).map(([key, max]) => [key, text(input[key], max)]));
  if (!fields.nombre || !fields.correo || !fields.descripcion) return response(400, "Please complete the required fields.");
  if (!emailPattern.test(fields.correo) || /[\r\n]/.test(fields.correo)) return response(400, "Please provide a valid email address.");
  if ([fields.nombre, fields.negocio, fields.telefono, fields.preferencia, fields.servicio].some((value) => /[\r\n\u0000-\u001f]/.test(value))) {
    return response(400, "Please review the submitted fields.");
  }

  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("CONTACT_FROM_EMAIL");
  const to = getEnv("CONTACT_TO_EMAIL");
  if (!apiKey || !from || !to || !emailPattern.test(from) || !emailPattern.test(to)) {
    context.error("Contact mail is unavailable because required settings are missing or invalid.");
    return response(503, "The contact form is temporarily unavailable. Please email directly.");
  }

  const send = sendEmail || (async (message) => new Resend(apiKey).emails.send(message));
  const rows = [
    ["Name", fields.nombre],
    ["Business", fields.negocio || "Not provided"],
    ["Email", fields.correo],
    ["Phone", fields.telefono || "Not provided"],
    ["Preferred contact", fields.preferencia || "Not specified"],
    ["Service", fields.servicio || "Not specified"],
    ["Language", fields.idioma || "Not specified"],
  ];
  const htmlRows = rows.map(([label, value]) => `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join("");
  const textRows = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const message = {
    from,
    to,
    replyTo: fields.correo,
    subject: "New PerdomoPro technology consultation inquiry",
    html: `${htmlRows}<p><strong>Description:</strong></p><div style="white-space:pre-wrap">${escapeHtml(fields.descripcion)}</div>`,
    text: `${textRows}\n\nDescription:\n${fields.descripcion}`,
  };

  try {
    const result = await send(message);
    if (result?.error) {
      context.error("Resend rejected a contact message.");
      return response(502, "The message could not be sent. Please try again or email directly.");
    }
    return response(200, "Message received.");
  } catch {
    context.error("Sending a contact message failed.");
    return response(502, "The message could not be sent. Please try again or email directly.");
  }
}

app.http("contact", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: (request, context) => handleContact(request, context),
});

module.exports = { handleContact, escapeHtml };
