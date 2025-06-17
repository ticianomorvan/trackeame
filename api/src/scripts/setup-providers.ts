import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

const PROVIDERS: Prisma.ProviderCreateInput[] = [
  {
    name: "Correo Argentino",
    slug: "correo-argentino",
    website: "https://www.correoargentino.com.ar/",
  },
  {
    name: "Andreani",
    slug: "andreani",
    website: "https://www.andreani.com/",
  },
  {
    name: "OCA",
    slug: "oca",
    website: "https://www.oca.com.ar/",
  }
]

async function setupProviders() {
  try {
    for (const provider of PROVIDERS) {
      try {
        await prisma.provider.create({
          data: {
            name: provider.name,
            slug: provider.slug,
            website: provider.website ?? null,
          },
        });

        console.log(`Provider ${provider.name} created successfully.`);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          console.warn(`Provider ${provider.name} already exists. Skipping creation.`);
          continue; // Skip if provider already exists
        }
      }
    }

    console.log("Database setup completed successfully.");
  } catch (error) {
    console.error("ERROR: Failed to set up database:", error);
    
    throw new Error(`Database setup failed: ${(error as Error).message}`);
  }
}

setupProviders()