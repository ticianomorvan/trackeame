import type { Provider } from "./provider";

export interface Package {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  lastStatus?: string;
  lastEventAt?: Date;
  lastCheckedAt: Date;

  trackingCode: string;

  providerId: string;
}

export interface PackageWithProvider extends Package {
  provider: Provider
}

export interface PaginatedPackagesWithProvider {
  packages: PackageWithProvider[];
  total: number;
  limit: number;
  page: number;
}