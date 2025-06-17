export interface Provider {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  name: string;
  slug: string;
  website?: string;
}

export enum ProviderSlug {
  CORREO_ARGENTINO = "correo-argentino",
  ANDREANI = "andreani",
  OCA = "oca",
}