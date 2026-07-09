/**
 * netlify/functions/send-email.js
 *
 * Reemplaza a Formspree para los dos formularios del sitio (cotización B2B
 * y contacto general), usando la API de Resend en vez de Formspree.
 *
 * Variable de entorno requerida en Netlify (Site settings → Environment
 * variables): RESEND_API_KEY
 *
 * IMPORTANTE sobre el remitente: sin un dominio verificado en Resend, solo
 * se puede ENVIAR correos a la dirección con la que se creó la cuenta de
 * Resend (zhivolt.ventas@gmail.com). Por eso:
 *   - Los correos "a la empresa" (cotización y contacto) siempre funcionan,
 *     porque su destinatario ya es esa misma dirección.
 *   - El correo de confirmación "al cliente" solo se entrega si el email que
 *     la persona escribió en el formulario coincide con esa dirección. Si no
 *     coincide, Resend lo rechaza — por diseño de esta función, ese rechazo
 *     NO hace fallar la solicitud completa (lo esencial es que la empresa
 *     reciba la cotización).
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const COMPANY_EMAIL = "zhivolt.ventas@gmail.com";
const FROM_ADDRESS = "ZhiVolt Importaciones <onboarding@resend.dev>";

async function sendResendEmail({ to, subject, html }) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildProductRowHtml(p) {
  return `
    <table role="presentation" width="100%" style="border-bottom:1px solid #D4D8DD;margin-bottom:14px;padding-bottom:14px;">
      <tr>
        <td style="width:110px;vertical-align:top;">
          <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" width="100"
               style="border:1px solid #D4D8DD;background:#FFFFFF;padding:6px;border-radius:6px;" />
        </td>
        <td style="vertical-align:top;padding-left:16px;font-family:Arial,sans-serif;">
          <p style="margin:0 0 6px;font-weight:bold;color:#1A2D42;">${escapeHtml(p.name)}</p>
          <p style="margin:0 0 6px;color:#1A2D42;">
            Precio unitario: <strong>${escapeHtml(p.priceLabel)}</strong> — aplicable desde ${escapeHtml(p.moq)} unidades
          </p>
          <p style="margin:0;font-size:13px;color:#5A6D85;">
            ${Object.entries(p.specs || {})
              .slice(0, 6)
              .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`)
              .join(" &middot; ")}
          </p>
        </td>
      </tr>
    </table>`;
}

function buildQuoteCompanyEmail(payload) {
  return `
    <div style="font-family:Arial,sans-serif;color:#1A2D42;max-width:600px;">
      <h2>Nueva solicitud de cotización — ${escapeHtml(payload.razon_social)}</h2>
      <p><strong>RUC:</strong> ${escapeHtml(payload.ruc)}</p>
      <p><strong>Razón social:</strong> ${escapeHtml(payload.razon_social)}</p>
      <p><strong>Cargo:</strong> ${escapeHtml(payload.cargo)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(payload.telefono)}</p>
      <p><strong>Proyección de compra mensual:</strong> ${escapeHtml(payload.proyeccion_mensual)}</p>
      <p><strong>Comentarios:</strong> ${escapeHtml(payload.comentarios || "—")}</p>
      <h3>Vehículos solicitados</h3>
      ${(payload.productos || []).map(buildProductRowHtml).join("")}
    </div>`;
}

function buildQuoteCustomerEmail(payload) {
  return `
    <div style="font-family:Arial,sans-serif;color:#1A2D42;max-width:600px;">
      <h2>Gracias por tu interés en ZhiVolt</h2>
      <p>Hemos recibido tu solicitud de cotización. Este es el detalle de los vehículos consultados:</p>
      ${(payload.productos || []).map(buildProductRowHtml).join("")}
      <p style="margin-top:18px;padding:14px;background:#F2EFEB;border-radius:8px;">
        Los precios mostrados son referenciales. El precio final se negocia
        directamente con uno de nuestros asesores comerciales, quien se
        pondrá en contacto contigo a la brevedad.
      </p>
    </div>`;
}

function buildContactCompanyEmail(payload) {
  return `
    <div style="font-family:Arial,sans-serif;color:#1A2D42;max-width:600px;">
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(payload.nombre)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Empresa:</strong> ${escapeHtml(payload.empresa || "—")}</p>
      <p><strong>Asunto:</strong> ${escapeHtml(payload.asunto)}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${escapeHtml(payload.mensaje).replace(/\n/g, "<br>")}</p>
    </div>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método no permitido" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "JSON inválido" }),
    };
  }

  try {
    if (payload.type === "quote") {
      const companyResult = await sendResendEmail({
        to: COMPANY_EMAIL,
        subject: `Nueva cotización B2B — ${payload.razon_social}`,
        html: buildQuoteCompanyEmail(payload),
      });

      if (!companyResult.ok) {
        return {
          statusCode: 502,
          body: JSON.stringify({
            error: "No se pudo notificar a la empresa",
            details: companyResult.data,
          }),
        };
      }

      let customerEmailSent = false;
      try {
        const customerResult = await sendResendEmail({
          to: payload.email,
          subject: "Tu cotización ZhiVolt — detalle de productos",
          html: buildQuoteCustomerEmail(payload),
        });
        customerEmailSent = customerResult.ok;
      } catch {
        customerEmailSent = false;
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, customerEmailSent }),
      };
    }

    if (payload.type === "contact") {
      const result = await sendResendEmail({
        to: COMPANY_EMAIL,
        subject: `Nuevo mensaje de contacto — ${payload.asunto}`,
        html: buildContactCompanyEmail(payload),
      });

      if (!result.ok) {
        return {
          statusCode: 502,
          body: JSON.stringify({
            error: "No se pudo enviar el mensaje",
            details: result.data,
          }),
        };
      }

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Tipo de envío no reconocido" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error interno al enviar el correo",
        details: String(error),
      }),
    };
  }
};
