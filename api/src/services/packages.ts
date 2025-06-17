import { Prisma } from "../generated/prisma"
import { prisma } from "../lib/prisma"
import { getProviderBySlug } from "./providers"

// TOOD: implement validation for providerSlug and trackingCode
export async function createPackage(userId: string, providerSlug: string, trackingCode: string) {
  try {
    const provider = await getProviderBySlug(providerSlug)
    const providerId = provider.id
    
    const packageEntry = await prisma.package.create({
      data: { trackingCode, providerId, userId },
      include: { provider: true }
    })

    return packageEntry
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error(`Package with tracking code ${trackingCode} already exists.`)
    }

    throw new Error(`Failed to create package entry: ${(error as Error).message}`)
  }
}

// TODO: implement validation for providerId and trackingCode
export async function getPackageByTrackingCode(userId: string, providerId: string, trackingCode: string) {
  try {
    const packageEntry = await prisma.package.findUniqueOrThrow({
      where: {
        userId,
        trackingCode_providerId: {
          providerId,
          trackingCode
        },
      },
      include: { provider: true }
    })

    return packageEntry
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new Error(`Package with tracking code ${trackingCode} doesn't exist for provider.`)
    }

    throw new Error(`Failed to get package entry: ${(error as Error).message}`)
  }
}

export async function getPackages(userId: string, limit: number = 10, page: number = 1) {
  try {
    const packages = await prisma.package.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { provider: true },
      skip: (page - 1) * limit,
      take: limit,
    })

    return packages
  } catch (error) {
    throw new Error(`Failed to get package entries: ${(error as Error).message}`)
  }
}

export async function getPackagesCount(userId: string) {
  try {
    const count = await prisma.package.count({
      where: { userId }
    })

    return count
  } catch (error) {
    throw new Error(`Failed to get package count: ${(error as Error).message}`)
  }
}

// TODO: implement validation for id
export async function getPackageById(userId: string, id: string) {
  try {
    const packageEntry = await prisma.package.findUniqueOrThrow({
      where: { id, userId },
      include: { provider: true }
    })

    return packageEntry
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new Error(`Package with ID ${id} doesn't exist.`)
    }

    throw new Error(`Failed to get package entry: ${(error as Error).message}`)
  }
}