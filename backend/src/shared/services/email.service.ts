import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../utils/logger.js';

function createTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

const transporter = createTransporter();
const from = env.SMTP_FROM ?? env.SMTP_USER ?? `noreply@pilarclub.com`;
const appName = env.APP_NAME;

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    logger.info({ to, subject }, 'Email omitido: SMTP no configurado');
    return;
  }
  try {
    await transporter.sendMail({ from: `"${appName}" <${from}>`, to, subject, html });
    logger.info({ to, subject }, 'Email enviado');
  } catch (err) {
    logger.error({ err, to, subject }, 'Error al enviar email');
  }
}

function wrap(content: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
      <h2 style="color:#1d4ed8;margin-bottom:16px">${appName}</h2>
      ${content}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="font-size:12px;color:#6b7280">Este email fue generado automáticamente. No respondas a este mensaje.</p>
    </div>`;
}

export const emailService = {
  async sendBookingConfirmed(to: string, data: {
    firstName: string;
    venueName: string;
    sportName: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    qrCode?: string | null;
  }) {
    const subject = `Reserva confirmada — ${data.sportName}: ${data.venueName}`;
    const html = wrap(`
      <p>Hola <strong>${data.firstName}</strong>,</p>
      <p>Tu reserva fue <strong>confirmada</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#6b7280">Espacio</td><td style="padding:8px;font-weight:600">${data.sportName}: ${data.venueName}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Fecha</td><td style="padding:8px">${data.date}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Horario</td><td style="padding:8px">${data.startTime} – ${data.endTime}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Monto</td><td style="padding:8px;font-weight:600">$${data.price.toLocaleString('es-AR')}</td></tr>
      </table>
      ${data.qrCode ? `<p>Tu código QR de acceso: <strong style="font-size:18px;letter-spacing:2px">${data.qrCode}</strong></p>` : ''}
      <p>¡Nos vemos en el club!</p>
    `);
    await send(to, subject, html);
  },

  async sendBookingPendingProof(to: string, data: {
    firstName: string;
    venueName: string;
    sportName: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    appUrl: string;
  }) {
    const subject = `Reserva pendiente de comprobante — ${data.sportName}: ${data.venueName}`;
    const html = wrap(`
      <p>Hola <strong>${data.firstName}</strong>,</p>
      <p>Tu reserva fue registrada. Para confirmarla, necesitamos que cargues el comprobante de transferencia.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#6b7280">Espacio</td><td style="padding:8px;font-weight:600">${data.sportName}: ${data.venueName}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Fecha</td><td style="padding:8px">${data.date}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Horario</td><td style="padding:8px">${data.startTime} – ${data.endTime}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Monto</td><td style="padding:8px;font-weight:600">$${data.price.toLocaleString('es-AR')}</td></tr>
      </table>
      <a href="${data.appUrl}/mis-reservas" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:8px">Ir a Mis Reservas</a>
    `);
    await send(to, subject, html);
  },

  async sendBookingCancelled(to: string, data: {
    firstName: string;
    venueName: string;
    sportName: string;
    date: string;
    startTime: string;
    endTime: string;
  }) {
    const subject = `Reserva cancelada — ${data.sportName}: ${data.venueName}`;
    const html = wrap(`
      <p>Hola <strong>${data.firstName}</strong>,</p>
      <p>Tu reserva fue <strong>cancelada</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#6b7280">Espacio</td><td style="padding:8px;font-weight:600">${data.sportName}: ${data.venueName}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Fecha</td><td style="padding:8px">${data.date}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Horario</td><td style="padding:8px">${data.startTime} – ${data.endTime}</td></tr>
      </table>
      <p>Si tenés alguna consulta, contactá con recepción.</p>
    `);
    await send(to, subject, html);
  },

  async sendTransferApproved(to: string, data: {
    firstName: string;
    venueName: string;
    sportName: string;
    date: string;
    startTime: string;
    endTime: string;
    qrCode?: string | null;
  }) {
    const subject = `¡Transferencia aprobada! — ${data.sportName}: ${data.venueName}`;
    const html = wrap(`
      <p>Hola <strong>${data.firstName}</strong>,</p>
      <p>Tu transferencia fue <strong>aprobada</strong> y tu reserva está confirmada.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#6b7280">Espacio</td><td style="padding:8px;font-weight:600">${data.sportName}: ${data.venueName}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Fecha</td><td style="padding:8px">${data.date}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Horario</td><td style="padding:8px">${data.startTime} – ${data.endTime}</td></tr>
      </table>
      ${data.qrCode ? `<p>Tu código QR de acceso: <strong style="font-size:18px;letter-spacing:2px">${data.qrCode}</strong></p>` : ''}
      <p>¡Nos vemos en el club!</p>
    `);
    await send(to, subject, html);
  },

  async sendTransferRejected(to: string, data: {
    firstName: string;
    venueName: string;
    sportName: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string | null;
    appUrl: string;
  }) {
    const subject = `Transferencia rechazada — ${data.sportName}: ${data.venueName}`;
    const html = wrap(`
      <p>Hola <strong>${data.firstName}</strong>,</p>
      <p>Lamentamos informarte que tu comprobante de transferencia fue <strong>rechazado</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#6b7280">Espacio</td><td style="padding:8px;font-weight:600">${data.sportName}: ${data.venueName}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Fecha</td><td style="padding:8px">${data.date}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Horario</td><td style="padding:8px">${data.startTime} – ${data.endTime}</td></tr>
        ${data.reason ? `<tr style="background:#fef2f2"><td style="padding:8px;color:#6b7280">Motivo</td><td style="padding:8px;color:#dc2626">${data.reason}</td></tr>` : ''}
      </table>
      <p>Podés volver a reservar desde la plataforma.</p>
      <a href="${data.appUrl}/reservas/nueva" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:8px">Nueva Reserva</a>
    `);
    await send(to, subject, html);
  },

  async sendPasswordChanged(to: string, firstName: string) {
    const subject = 'Tu contraseña fue cambiada';
    const html = wrap(`
      <p>Hola <strong>${firstName}</strong>,</p>
      <p>Tu contraseña fue cambiada exitosamente.</p>
      <p>Si no realizaste este cambio, contactá con el administrador de inmediato.</p>
    `);
    await send(to, subject, html);
  },
};
