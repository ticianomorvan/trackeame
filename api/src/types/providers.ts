import { PackageEvent } from "../generated/prisma";

export enum ProviderSlug {
  CORREO_ARGENTINO = "correo-argentino",
  ANDREANI = "andreani",
  OCA = "oca",
}

export interface ProviderHandlerArgs {
  packageId: string;
  trackingCode: string;
}

export type ProviderHandler = (args: ProviderHandlerArgs) => Promise<PackageEvent[]>;