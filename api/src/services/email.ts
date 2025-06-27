import { PackageEventStatus } from "../types/package-events";
import { Package, Provider } from "../generated/prisma";
import { resend } from "../lib/resend";
import { env } from "../lib/env";

function getStatusText(status: PackageEventStatus | null): string {
  switch (status) {
    case PackageEventStatus.Delivered:
      return "Entregado";
    case PackageEventStatus.InTransit:
      return "En tránsito";
    case PackageEventStatus.Pending:
      return "Pendiente";
    case PackageEventStatus.Failed:
      return "Fallido";
    case PackageEventStatus.Cancelled:
      return "Cancelado";
    default:
      return "Desconocido";
  }
}

interface SendNotificationEmailParams {
  data: {
    pkg: Package;
    provider: Provider;
  }
  toAddress: string;
}

export const sendNotificationEmail = async ({ data, toAddress }: SendNotificationEmailParams) => {
  const lastStatus = data.pkg.lastStatus !== null
    ? data.pkg.lastStatus as PackageEventStatus
    : null;

  const result = await resend.emails.send({
    from: `Ticiano de Trackeame <${env.RESEND_SOURCE_ADDRESS}>`,
    to: toAddress,
    subject: `¡Tenés novedades en tu paquete! [${data.provider.name} ${data.pkg.trackingCode}]`,
    html: `<html><body style="font-family:Arial,sans-serif;">` +
          `<h1>¡Tenés novedades en tu paquete!</h1>` +
          `<p>Hola, tenés novedades en tu paquete de <strong>${data.provider.name}</strong> con el código de seguimiento <strong>${data.pkg.trackingCode}</strong>.</p>` +
          `<p>El estado actual de tu paquete es: <strong>${getStatusText(lastStatus)}</strong>.</p>` +
          `<p>Podés ver los detalles de tu paquete en el siguiente enlace:</p>` +
          `<p><a href="${env.FRONTEND_URL}/packages/${data.pkg.id}">Ver paquete</a></p>` +
          `<p>¡Saludos!<br>El equipo de Trackeame</p>` +
          `</body></html>`,
    text: `¡Hola! Tenés novedades en tu paquete de ${data.provider.name} con el código de seguimiento ${data.pkg.trackingCode}.\n\n` +
          `El estado actual de tu paquete es: ${getStatusText(lastStatus)}.\n\n` +
          `Podés ver los detalles de tu paquete en el siguiente enlace:\n` +
          `${env.FRONTEND_URL}/packages/${data.pkg.id}\n\n` +
          `¡Saludos!\n` +
          `El equipo de Trackeame`,
  })

  if (!result.data) {
    throw new Error(result.error?.message)
  }
}