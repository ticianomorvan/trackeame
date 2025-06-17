/* Module: CORREO ARGENTINO */

import * as cheerio from "cheerio"
import { chromium } from "playwright"
import { parse } from "date-fns"

import { PackageEvent } from "../../generated/prisma"
import { ProviderHandler } from "../../types/providers"
import { PackageEventStatus } from "../../types/package-events"
import { upsertPackageEvent } from "../package-events"
import { GOTO_TIMEOUT, WAITFOR_TIMEOUT } from "./constants"

/* TYPE ALIASES */

type EventDate = string
type EventDescription = string
type EventLocation = string
type EventStatus = string

type CorreoArgentinoPackageEvent = [EventDate, EventLocation, EventDescription, EventStatus]

/* CONSTANTS */

const BASE_URL = "https://www.correoargentino.com.ar/formularios"

const ECOMMERCE_TRACKING_CODE_REGEX = /^[A-Z0-9]{23}$/

/* PROVIDER HANDLER */

// TODO: implement validation for packageId and trackingCode
export const trackCorreoArgentinoPackage: ProviderHandler = async ({ packageId, trackingCode }) => {
  if (!ECOMMERCE_TRACKING_CODE_REGEX.test(trackingCode)) {
    throw new Error("For now, only e-commerce tracking codes are supported. Please provide a valid tracking code.")
  }

  // TODO: implement the rest of the tracking logic
  return trackEcommercePackage(packageId, trackingCode)
}

export async function trackEcommercePackage(packageId: string, trackingCode: string): Promise<PackageEvent[]> {
  const trackingUrl = `${BASE_URL}/e-commerce`

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    // We navigate to the e-commerce tracking page,
    // where we will input the tracking code to fetch the package events.
    // We then parse each event into a structured format.
    // Finally, we create package events in the database
    // and return the created events.

    await page.goto(trackingUrl, {
      waitUntil: "domcontentloaded",
      timeout: GOTO_TIMEOUT
    })

    const input = page.locator('input.codigo')
    
    await input.fill(trackingCode)

    await input.press("Enter")

    const tableContainer = page.locator("div#no-more-tables")

    await tableContainer.waitFor({ state: "visible", timeout: WAITFOR_TIMEOUT })

    const tableContainerHtml = await tableContainer.innerHTML()

    if (!tableContainerHtml) {
      throw new Error("No tracking information found for the provided code.")
    }

    const $ = cheerio.load(tableContainerHtml)
    const tbody = $("tbody")

    // Parse each history row into a CorreoArgentinoPackageEvent (An array with determined structure)
    const rows = $(tbody).find("tr").get()
      .map((row) => $(row).find("td").get()
      .map((td) => $(td).text().trim())) as CorreoArgentinoPackageEvent[]

    const rawPackageEvents = rows.map((row) => {
      const [date, location, description, status] = row
      
      return {
        location,
        status: parseCorreoArgentinoEventStatus(description, status),
        occurredAt: parse(date, "dd-MM-yyyy HH:mm", new Date()),
        description: status.length > 0 ? `${description} - ${status}` : description,
      }
    })

    const sortedRawPackageEvents = rawPackageEvents
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())

    const packageEvents: PackageEvent[] = [];

    for (const event of sortedRawPackageEvents) {
      try {
        const packageEvent = await upsertPackageEvent(packageId, {
          status: event.status,
          location: event.location,
          occurredAt: event.occurredAt,
          description: event.description,
        })

        packageEvents.push(packageEvent)
      } catch (error) {
        throw new Error(`Failed to create package event: ${(error as Error).message}`)
      }
    }

    return packageEvents
  } catch (error) {
    throw new Error(`Failed to track ecommerce package: ${(error as Error).message}`)
  } finally {
    await browser.close()
  }
}

const PENDING_KEYWORDS = [
  "preimposicion",
  "repesaje",
  "ingreso al correo",
  "colectada",
  "pendiente",
]

const IN_TRANSIT_KEYWORDS = [
  "en proceso de clasificacion",
  "llegada al centro de procesamiento",
  "documentacion en proceso de devolucion",
  "en poder del distribuidor",
  "en poder del cartero",
]

const SUCCESSFUL_DELIVERY_KEYWORDS = [
  "entregado",
  "entrega en sucursal",
]

const FAILED_DELIVERY_TRY_KEYWORDS = [
  "plazo vencido",
  "domicilio cerrado",
  "en espera en sucursal",
]

// Correo Argentino determines package's status based on the description of the event.
function parseCorreoArgentinoEventStatus(description: string, status: string): PackageEventStatus {
  const normalizedDescription = description
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  const normalizedStatus = status
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  let finalStatus: PackageEventStatus = PackageEventStatus.Pending;

  if (PENDING_KEYWORDS.some(keyword => normalizedDescription.includes(keyword))) {
    finalStatus = PackageEventStatus.Pending
  } else if (IN_TRANSIT_KEYWORDS.some(keyword => normalizedDescription.includes(keyword))) {
    finalStatus = PackageEventStatus.InTransit
  } else if (normalizedDescription.includes("intento de entrega")) {
    if (FAILED_DELIVERY_TRY_KEYWORDS.some(keyword => normalizedStatus.includes(keyword))) {
      finalStatus = PackageEventStatus.Failed
    } else if (SUCCESSFUL_DELIVERY_KEYWORDS.some(keyword => normalizedStatus.includes(keyword))) {
      finalStatus = PackageEventStatus.Delivered
    }
  }

  return finalStatus
}