import { es } from "date-fns/locale";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns"
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { ArrowLeft, ArrowRight, MapPinIcon, TriangleAlertIcon } from "lucide-react";
import { Badge, Button, Callout, Flex, Heading, Spinner, Text, Tooltip } from "@radix-ui/themes";

import type { PackageWithProvider } from "types/package";
import type { PackageEvent } from "types/package-event";

import { PackageEventStatus } from "types/package-event";
import { ResponseType } from "types/response";
import { fetcher } from "utils/fetch";

import type { ProviderSlug } from "types/provider";
import { useAuth } from "contexts/auth-context";

import { PROVIDER_LOGOS } from "../../constants";
import { getStatusBadgeColor, getStatusBadgeText } from "./utils";

const MAX_EVENTS_PER_PAGE = 5;
const EVENTS_REFETCH_INTERVAL_IN_MILLISECONDS = 30_000; // 30 seconds

const getRefetchInterval = (lastStatus: string | null | undefined): number | false => {
  return lastStatus && (lastStatus !== PackageEventStatus.Delivered && lastStatus !== PackageEventStatus.Cancelled)
    ? EVENTS_REFETCH_INTERVAL_IN_MILLISECONDS
    : false;
}

export default function PackageHistory() {
  const auth = useAuth();
  const params = useParams()

  const limit = MAX_EVENTS_PER_PAGE; // This is temporary, just to test.
  const [page, setPage] = useState<number>(1);

  const pkg = useQuery({
    queryKey: ["package", params.packageId],
    queryFn: async () => {
      if (!params.packageId) {
        throw new Error("Se necesita un ID de paquete");
      }

      if (!auth.user) {
        throw new Error("Por favor, inicia sesión para continuar.");
      }

      const idToken = await auth.user.getIdToken();

      const response = await fetcher<PackageWithProvider>(`/packages/${params.packageId}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.status === ResponseType.Error) {
        console.error(response.message);

        throw new Error(response.message);
      }

      return response.data;
    },
  })

  const pkgEvents = useQuery({
    queryKey: ["package-events", params.packageId],
    queryFn: async () => {
      if (!params.packageId) {
        throw new Error("Package ID is required");
      }

      if (!auth.user) {
        throw new Error("Por favor, iniciá sesión para continuar.");
      }

      const idToken = await auth.user.getIdToken();

      const response = await fetcher<PackageEvent[]>(`/packages/${params.packageId}/tracking`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (response.status === ResponseType.Error) {
        console.error(response.message);

        throw new Error(response.message);
      }

      return response.data;
    },
    refetchInterval: getRefetchInterval(pkg.data?.lastStatus)
  });

  const lastStatus = typeof pkg.data !== "undefined" && pkg.data.lastStatus != null
    ? pkg.data.lastStatus as PackageEventStatus
    : PackageEventStatus.Pending;

  const lastCheckedAt = typeof pkg.data !== "undefined" && pkg.data.lastCheckedAt != null
    ? pkg.data.lastCheckedAt
    : new Date();

  const formattedLastCheckedAt = format(lastCheckedAt, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });

  const totalPages = pkgEvents.data ? Math.ceil(pkgEvents.data.length / limit) : 0;

  const canGoToPreviousPage = page > 1;
  const canGoToNextPage = page < totalPages;

  const handlePreviousPage = () => {
    if (canGoToPreviousPage) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (canGoToNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  // We may not really implement pagination for this, as the events are usually not that many.
  const shownEvents = useMemo(() => {
    if (!pkgEvents.data) return [];

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return pkgEvents.data.slice(startIndex, endIndex);

  }, [pkgEvents.data, page, limit])

  if (pkg.isLoading) {
    return (
      <Callout.Root color={"blue"}>
        <Callout.Icon>
          <Spinner />
        </Callout.Icon>

        <Callout.Text>
          Recuperando datos del paquete...
        </Callout.Text>
      </Callout.Root>
    );
  }

  if (pkg.isError) {
    return (
      <Callout.Root color={"red"}>
        <Callout.Icon>
          <TriangleAlertIcon size={16} />
        </Callout.Icon>

        <Callout.Text>
          No pudimos obtener el paquete. Inténtalo de nuevo más tarde.
        </Callout.Text>
      </Callout.Root>
    );
  }

  if (pkgEvents.isLoading) {
    return (
      <Callout.Root color={"blue"}>
        <Callout.Icon>
          <Spinner />
        </Callout.Icon>

        <Callout.Text>
          Cargando eventos del paquete...
        </Callout.Text>
      </Callout.Root>
    );
  }

  if (pkgEvents.isError) {
    return (
      <Callout.Root color={"red"}>
        <Callout.Icon>
          <TriangleAlertIcon size={16} />
        </Callout.Icon>

        <Callout.Text>
          No pudimos obtener los eventos del paquete. Inténtalo de nuevo más tarde.
        </Callout.Text>
      </Callout.Root>
    );
  }

  const shouldShowEvents = pkg.data && pkgEvents.data && pkgEvents.data.length > 0;

  return (
    <Flex
      gap={"2rem"}
      minHeight={!shouldShowEvents ? "auto" : "24rem"}
      direction={"column"}
      justify={"between"}
    >
      <Flex
        gap={"1rem"}
        direction={"column"}
      >
        <Flex
          gap={"0.5rem"}
          align={"center"}
          justify={"between"}
        >
          <Heading
            as={"h3"}
            size={"4"}
            color={"gray"}
            weight={"regular"}
          >
            Nº <strong>{pkg.data?.trackingCode}</strong>
          </Heading>

          <Flex
            gap={"0.5rem"}
            align={"center"}
          >
            <Badge color={getStatusBadgeColor(lastStatus)}>
              {getStatusBadgeText(lastStatus)}
            </Badge>

            {pkg.data?.provider && (
              <img
                src={PROVIDER_LOGOS[pkg.data?.provider.slug as ProviderSlug]}
                alt={pkg.data?.provider.name}
                className="w-24 h-8"
              />
            )}
          </Flex>
        </Flex>

        {!shouldShowEvents
          ? (
            <Callout.Root color={"gray"}>
              <Callout.Icon>
                <TriangleAlertIcon size={16} />
              </Callout.Icon>

              <Callout.Text>
                No hay eventos registrados para este paquete.
              </Callout.Text>
            </Callout.Root>
          ) : (
            <ul>
              <Flex
                gap={"0.5rem"}
                direction={"column"}
              >
                {shownEvents.map((event) => {
                  const eventAbsoluteDate = parseISO(String(event.occurredAt));
                  const eventFormattedDate = format(eventAbsoluteDate, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });

                  const eventStatus = typeof event.status !== "undefined"
                    ? event.status as PackageEventStatus
                    : PackageEventStatus.Pending;

                  return (
                    <li key={event.id}>
                      <Flex
                        p={"1rem"}
                        gap={"0.5rem"}
                        direction={"column"}
                        className="bg-[var(--accent-surface)] rounded-md shadow-sm"
                      >
                        <Flex
                          width={"100%"}
                          align={"center"}
                          direction={"row"}
                          justify={"between"}
                        >
                          <Badge color={getStatusBadgeColor(eventStatus)}>
                            {getStatusBadgeText(eventStatus)}
                          </Badge>

                          <Flex
                            gap={"0.5rem"}
                            align={"center"}
                            justify={"center"}
                            className="text-[var(--gray-a11)]"
                          >
                            <Text size={"2"}>
                              {eventFormattedDate}
                            </Text>

                            {event.location && (
                              <Tooltip content={event.location}>
                                <MapPinIcon size={16} />
                              </Tooltip>
                            )}
                          </Flex>
                        </Flex>

                        <p>{event.description}</p>
                      </Flex>
                    </li>
                  )
                })}
              </Flex>
            </ul>
          )}
      </Flex>

      {totalPages !== 0 && (
        <Flex
          gap={"1rem"}
          direction={"column"}
        >
          <Flex
            gap={"1rem"}
            align={"center"}
            justify={"center"}
          >
            <Button
              color={"gray"}
              variant={"soft"}
              onClick={handlePreviousPage}
              disabled={!canGoToPreviousPage}
            >
              <ArrowLeft size={14} /> Anterior
            </Button>

            {totalPages && (
              <Text>
                Página {page} de {totalPages}
              </Text>
            )}

            <Button
              color={"gray"}
              variant={"soft"}
              onClick={handleNextPage}
              disabled={!canGoToNextPage}
            >
              Siguiente <ArrowRight size={14} />
            </Button>
          </Flex>


          <Text
            size={"1"}
            align={"center"}
            color={"gray"}
          >
            Ultima actualización: {formattedLastCheckedAt}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}