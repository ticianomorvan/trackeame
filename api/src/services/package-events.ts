import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

export async function upsertPackageEvent(packageId: string, input: Prisma.PackageEventCreateWithoutPackageInput) {
  try {
    if (!input.occurredAt) {
      throw new Error("The 'occurredAt' field is required to create a package event.");
    }

    const packageEvent = await prisma.packageEvent.upsert({
      where: {
        packageId_occurredAt: {
          packageId,
          occurredAt: input.occurredAt
        }
      },
      update: {
        status: input.status ?? null,
        rawStatus: input.rawStatus ?? null,
        description: input.description ?? null,
        location: input.location ?? null,
      },
      create: {
        status: input.status ?? null,
        rawStatus: input.rawStatus ?? null,
        description: input.description ?? null,
        location: input.location ?? null,
        occurredAt: input.occurredAt,
        packageId,
      }
    });

    await prisma.package.update({
      where: { id: packageId },
      data: {
        lastStatus: input.status ?? null,
        lastEventAt: input.occurredAt,
        lastCheckedAt: new Date(),
      }
    });

    return packageEvent;
  } catch (error) {
    throw new Error(`Failed to create package event: ${(error as Error).message}`);
  }
}

export async function getPackageEvents(packageId: string) {
  try {
    const packageEvents = await prisma.packageEvent.findMany({
      where: { packageId },
      orderBy: { createdAt: "desc" },
      include: { package: true }
    });

    return packageEvents;
  } catch (error) {
    throw new Error(`Failed to get package events for package with ID ${packageId}: ${(error as Error).message}`);
  }
}