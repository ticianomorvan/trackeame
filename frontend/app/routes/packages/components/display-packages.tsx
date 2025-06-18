import { useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, TriangleAlertIcon } from "lucide-react";
import { Badge, Button, Callout, Flex, Spinner, Text } from "@radix-ui/themes";

import type { PaginatedPackagesWithProvider } from "types/package";
import type { ProviderSlug } from "types/provider";

import { ResponseType } from "types/response";
import { PackageEventStatus } from "types/package-event";
import { fetcher } from "utils/fetch";

import { useAuth } from "~/contexts/auth-context";
import { PROVIDER_LOGOS } from "~/routes/constants";
import { getStatusBadgeColor, getStatusBadgeText } from "./utils";

const MAX_PACKAGES_PER_PAGE = 5;

export default function DisplayPackages() {
  const limit = MAX_PACKAGES_PER_PAGE // This is temporary, just to test.
  
  const auth = useAuth();
  
  const [page, setPage] = useState<number>(1);
  
  const packages = useQuery({
    queryKey: ["packages", page],
    queryFn: async () => {
      if (!auth.user) {
        throw new Error("Por favor, inicia sesión para continuar.");
      }

      const idToken = await auth.user.getIdToken();
      
      const response = await fetcher<PaginatedPackagesWithProvider>(`/packages?limit=${limit}&page=${page}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.status === ResponseType.Error) {
        console.error(response.message);

        throw new Error(response.message);
      }

      return response.data;
    },
    placeholderData: keepPreviousData,
  })

  const totalPages = packages.data ? Math.ceil(packages.data.total / limit) : 0;

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

  if (packages.isLoading) {
    return (
      <Callout.Root color={"blue"}>
        <Callout.Icon>
          <Spinner />
        </Callout.Icon>

        <Callout.Text>
          Cargando tus paquetes.
        </Callout.Text>
      </Callout.Root>
    )
  }

  if (packages.isError) {
    return (
      <Callout.Root color={"red"}>
        <Callout.Icon>
          <TriangleAlertIcon size={16} />
        </Callout.Icon>

        <Callout.Text>
          No pudimos cargar tus paquetes, intenta de nuevo más tarde.
        </Callout.Text>
      </Callout.Root>
    )
  }

  return (
    <Flex
      gap={"2rem"}
      height={"22rem"}
      maxHeight={"22rem"}
      justify={"between"}
      direction={"column"}
    >
      <ul>
        <Flex
          gap={"0.5rem"}
          direction={"column"}
        >
          {packages.data?.packages.map((pkg) => {
            const lastStatus = typeof pkg.lastStatus !== "undefined"
              ? pkg.lastStatus as PackageEventStatus
              : PackageEventStatus.Pending;

            return (
              <li key={pkg.id}>
                <Link to={`/packages/${pkg.id}`}>
                  <Flex
                    px={"1"}
                    py={"2"}
                    gap={"1rem"}
                    align={"center"}
                    maxHeight={"3rem"}
                    className={"bg-[var(--accent-surface)] rounded-md shadow-sm hover:bg-[var(--accent-a1)]"}
                  >
                    <img
                      src={PROVIDER_LOGOS[pkg.provider.slug as ProviderSlug]}
                      alt={`${pkg.provider.name} icon`}
                      className={"inline-block w-24 h-full"}
                    />

                    <Badge variant="soft" color={getStatusBadgeColor(lastStatus)}>
                      {getStatusBadgeText(lastStatus)}
                    </Badge>
                
                    {pkg.trackingCode}
                  </Flex>
                </Link>
              </li>
            )
          })}
        </Flex>
      </ul>

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

        {(packages.data?.total && packages.data?.limit) && (
          <Text>
            Página {page} de {Math.ceil(packages.data.total / packages.data.limit)}
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
    </Flex>
  );
}