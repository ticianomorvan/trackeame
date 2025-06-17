import * as cheerio from "cheerio"
import { chromium } from "playwright"
import { parse } from "date-fns"

import { GOTO_TIMEOUT, WAITFOR_TIMEOUT } from "./constants"
import { ProviderHandler } from "../../types/providers"
import { PackageEvent } from "../../generated/prisma"
import { upsertPackageEvent } from "../package-events"
import { PackageEventStatus } from "../../types/package-events"

/* TYPE ALIASES */

type AndreaniPackageEvent = {
  occurredAt: Date
  status: string
  location: string | null
  description: string
}

const BASE_URL = "https://www.andreani.com/envio/"

const ANDREANI_TRACKING_CODE_REGEX = /^[A-Z0-9]{15}$/ // 15 digits tracking code

export const trackAndreaniPackage: ProviderHandler = async ({ packageId, trackingCode }) => {
  if (!ANDREANI_TRACKING_CODE_REGEX.test(trackingCode)) {
    throw new Error("Invalid Andreani tracking code. It should be a 15-digit number.")
  }

  const trackingUrl = `${BASE_URL}${trackingCode}`

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(trackingUrl, {
      waitUntil: "domcontentloaded",
      timeout: GOTO_TIMEOUT
    })

    const verticalTimeline = page.locator("div[data-testid='vertical-timeline']")
    const isTrackingAvailable = await verticalTimeline.isVisible()

    if (!isTrackingAvailable) {
      const trackingDropdownContainer = page.locator("div[data-testid='container']")
      const trackingDropdownClickable = trackingDropdownContainer.locator(":scope > *").first()
      await trackingDropdownClickable.click()
      await verticalTimeline.waitFor({ state: "visible", timeout: WAITFOR_TIMEOUT })
    }

    const verticalTimelineHtml = await verticalTimeline.innerHTML()
    const $ = cheerio.load(verticalTimelineHtml)

    const timelineItems: AndreaniPackageEvent[] = $("ul[data-testid=vertical-timeline-item]")
      .find("li").get().map((item) => {
        const dateSpanContent = $(item).find("span[class*=_date]").text().trim()

        const timeSpanContent = $(item).find("span[class*=_time]").text().trim()
        const timeSpanMatch = timeSpanContent.match(/(\d{2}:\d{2})(?=\s*hs\.?)/)
        const timeSpanValue =  timeSpanMatch ? timeSpanMatch[1] : "00:00"

        const timestamp = `${dateSpanContent} ${timeSpanValue}`

        const occurredAt = parse(timestamp, "dd-MM-yyyy HH:mm", new Date())

        const descriptionElement = $(item).find("h5")
        const descriptionParentElement = descriptionElement.parent()
        const description = descriptionElement.text().trim()

        const locationString = descriptionParentElement.find("b").text().trim()
        const location = locationString !== "" ? locationString : null

        const status = parseAndreaniEventStatus(description)

        return {
          status,
          location,
          occurredAt,
          description
        }
      })
      .filter((item) => {
        return (
          item.occurredAt instanceof Date &&
          !isNaN(item.occurredAt.getTime()) &&
          item.description &&
          item.description.length > 0
        )
      })

      const sortedTimelineItems = timelineItems
        .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())

      const packageEvents: PackageEvent[] = []
        
      for (const timelineItem of sortedTimelineItems) {
        try {
          const packageEvent = await upsertPackageEvent(packageId, {
            status: timelineItem.status,
            location: timelineItem.location,
            occurredAt: timelineItem.occurredAt,
            description: timelineItem.description,
          })

          packageEvents.push(packageEvent)
        } catch (error) {
          throw new Error(`Failed to create package event: ${(error as Error).message}`)
        }
      }

    return packageEvents
  } catch (error) {
    throw new Error(`Failed to track Andreani package: ${(error as Error).message}`)
  } finally {
    await browser.close()
  }
}

const PENDING_KEYWORDS = [
  "pendiente de ingreso"
]

const IN_TRANSIT_KEYWORDS = [
  "fue recibido",
  "se encuentra en camino",
  "procesando tu envio",
  "entregarte tu envio",
  "podes retirar tu envio",
  "en camino",
]

const FAILED_DELIVERY_KEYWORDS = [
  "no logramos realizar la entrega",
]

const SUCCESSFUL_DELIVERY_KEYWORDS = [
  "entregamos tu envio",
]

const CANCELED_KEYWORDS = [
  "no logramos realizar la entrega de tu envio"
]

function parseAndreaniEventStatus(description: string): PackageEventStatus {
  const normalizedDescription = description
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  let finalStatus: PackageEventStatus = PackageEventStatus.Pending
  
  if (PENDING_KEYWORDS.some(keyword => normalizedDescription.includes(keyword))) {
    finalStatus = PackageEventStatus.Pending
  } else if (IN_TRANSIT_KEYWORDS.some(keyword => normalizedDescription.includes(keyword))) {
    finalStatus = PackageEventStatus.InTransit
  } else if (FAILED_DELIVERY_KEYWORDS.some(keyword => normalizedDescription.includes(keyword))) {
    finalStatus = PackageEventStatus.Failed
  } else if (SUCCESSFUL_DELIVERY_KEYWORDS.some(keyword => normalizedDescription.includes(keyword))) {
    finalStatus = PackageEventStatus.Delivered
  } else if (CANCELED_KEYWORDS.some(keyword => normalizedDescription.includes(keyword))) {
    finalStatus = PackageEventStatus.Cancelled
  }

  return finalStatus
}