const { app } = require("@azure/functions");
const { Resend } = require("resend");

app.http("contact", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { nombre, negocio, correo, servicio, descripcion } = body;

      if (!nombre || !correo || !descripcion) {
        return {
          status: 400,
          jsonBody: { ok: false, message: "Faltan campos obligatorios." }
        };
      }

      const resend = new Resend(process.env.RESEND_API_KEY);

      const htmlContent = `
        <h2>Nueva solicitud de contacto: ${negocio || 'Independiente'}</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Correo:</strong> ${correo}</p>
        <p><strong>Servicio:</strong> ${servicio || 'No especificado'}</p>
        <p><strong>Descripción:</strong></p>
        <p>${descripcion}</p>
      `;

      const data = await resend.emails.send({
        from: process.env.CONTACT_FROM_EMAIL || 'contacto@perdomopro.com',
        to: process.env.CONTACT_TO_EMAIL || 'adrian.perdomo1507@gmail.com',
        subject: `Nueva solicitud de consultoría de ${nombre}`,
        html: htmlContent
      });

      if (data.error) {
        context.error("Resend API Error:", data.error);
        return {
          status: 500,
          jsonBody: { ok: false, message: "Error al enviar el correo." }
        };
      }

      context.log("Correo enviado exitosamente:", data);

      return {
        status: 200,
        jsonBody: {
          ok: true,
          message: "Mensaje enviado correctamente."
        }
      };
    } catch (error) {
      context.error("Error en /api/contact:", error);

      return {
        status: 400,
        jsonBody: {
          ok: false,
          message: "Solicitud inválida o error en el servidor."
        }
      };
    }
  }
});