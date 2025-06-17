import { Prisma } from "../generated/prisma"
import { prisma } from "../lib/prisma"

export async function createProvider(input: Prisma.ProviderCreateInput) {
  try {
    const provider = await prisma.provider.create({
      data: {
        name: input.name,
        slug: input.slug,
        website: input.website ?? null,
      }
    })

    return provider
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error(`Provider with slug ${input.slug} already exists.`)
    }

    throw new Error(`Failed to create provider: ${(error as Error).message}`)
  }
}

export async function getProviderBySlug(slug: string) {
  try {
    const provider = await prisma.provider.findUniqueOrThrow({
      where: { slug }
    })

    return provider
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new Error(`Provider with slug ${slug} doesn't exist.`)
    }

    throw new Error(`Failed to get provider: ${(error as Error).message}`)
  }
}

export async function getProviders() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { name: "asc" }
    })

    return providers
  } catch (error) {
    throw new Error(`Failed to get providers entries: ${(error as Error).message}`)
  }
}