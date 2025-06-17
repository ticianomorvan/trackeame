import { PackageEventStatus } from "types/package-event";

export function getStatusBadgeColor(status: PackageEventStatus) {
  switch (status) {
    case PackageEventStatus.Delivered:
      return "green";
    case PackageEventStatus.InTransit:
      return "blue";
    case PackageEventStatus.Pending:
      return "yellow";
    case PackageEventStatus.Failed:
    case PackageEventStatus.Cancelled:
      return "red";
    default:
      return "gray";
  }
}

export function getStatusBadgeText(status: PackageEventStatus) {
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