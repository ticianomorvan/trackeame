export enum PackageEventStatus {
  Pending = "pending",
  InTransit = "in_transit",
  Delivered = "delivered",
  Failed = "failed",
  Cancelled = "cancelled",
}

export interface PackageEvent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  occurredAt: Date;

  status?: PackageEventStatus;
  location?: string;
  description?: string;
  rawStatus?: string;

  packageId: string;
}