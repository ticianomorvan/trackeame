import { Link } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BadgeCheckIcon, TriangleAlertIcon } from "lucide-react";
import { Button, Callout, Flex, Select, Spinner, TextField } from "@radix-ui/themes";

import type { PackageWithProvider } from "types/package";
import type { Provider } from "types/provider";

import { ResponseType } from "types/response";
import { ProviderSlug } from "types/provider";
import { fetcher } from "utils/fetch";

import { PROVIDER_LOGOS } from "~/routes/constants";

interface UpsertPackageMutationVariables {
  trackingCode: string;
  providerSlug: string;
}
  
export default function UpsertPackage() {
  const { getAccessTokenSilently } = useAuth0();

  const [trackingCode, setTrackingCode] = useState<string>("");
  const [providerSlug, setProviderSlug] = useState<string>("");

  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const token = await getAccessTokenSilently();

      const response = await fetcher<Provider[]>("/providers", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === ResponseType.Error) {
        console.error(response.message);

        throw new Error(response.message);
      }

      return response.data;
    }
  })

  const upsertPackage = useMutation({
    mutationKey: ["upsert-package"],
    mutationFn: async ({ trackingCode, providerSlug }: UpsertPackageMutationVariables) => {
      const token = await getAccessTokenSilently();

      const response = await fetcher<PackageWithProvider>("/packages", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          trackingCode,
          providerSlug,
        }),
      })

      if (response.status === ResponseType.Error) {
        console.error(response.message);

        throw new Error(response.message);
      }

      return response.data;
    }
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!trackingCode || !providerSlug) {
      alert("Please fill in all fields.");
      
      return;
    }

    upsertPackage.mutate({ trackingCode, providerSlug }, {
      onSuccess: (data) => {
        console.log("Package upserted successfully:", data);
        
        // Optionally reset form or show success message
        setTrackingCode("");
        setProviderSlug("");
      },
      onError: (error) => {
        console.error("Error upserting package:", error);

        alert("Failed to upsert package. Please try again.");
      }
    });
  }

  const trackingCodeExample = useMemo(() => {
    switch (providerSlug) {
      case ProviderSlug.CORREO_ARGENTINO:
        return "00008945903AEAX1CL02302";
      case ProviderSlug.ANDREANI:
        return "360002423941550";
      case ProviderSlug.OCA:
        return "6177500000000645550";
      default:
        return "0000000000000000";
    }
  }, [providerSlug]);

  if (providers.isLoading) {
    return (
      <Callout.Root color={"blue"}>
        <Callout.Icon>
          <Spinner />
        </Callout.Icon>

        <Callout.Text>
          Cargando proveedores...
        </Callout.Text>
      </Callout.Root>
    );
  }

  if (providers.isError) {
    return (
      <Callout.Root color={"red"}>
        <Callout.Icon>
          <TriangleAlertIcon size={16} />
        </Callout.Icon>

        <Callout.Text>
          No pudimos obtener los proveedores. Inténtalo de nuevo más tarde.
        </Callout.Text>
      </Callout.Root>
    );
  }

  return (
    <Flex
      gap={"1rem"}
      direction={"column"}
    >
      {upsertPackage.isSuccess && (
        <Callout.Root color={"green"}>
          <Callout.Icon>
            <BadgeCheckIcon size={16} />
          </Callout.Icon>
          <Callout.Text>
            Tu paquete se ha registró correctamente!
            {" "}
            <Link
              to={`/packages/${upsertPackage.data?.id}`}
              className="underline"
            >
              Chequealo acá
            </Link>
          </Callout.Text>
        </Callout.Root>
      )}
          
      <form onSubmit={handleSubmit}>
        <Flex
          gap={"1rem"}
          direction={"column"}
        >
          <Flex
            gap={"0.5rem"}
            align={"center"}
          >
            {providerSlug && (
              <img
                src={PROVIDER_LOGOS[providerSlug as ProviderSlug]}
                alt="Provider Logo"
                className="w-20 h-8 object-contain"
              />
            )}

            <Select.Root value={providerSlug} onValueChange={setProviderSlug}>
              <Select.Trigger placeholder={"Seleccioná un proveedor"} />

              <Select.Content>
                {providers.data?.map((provider: Provider) => (
                  <Select.Item key={provider.id} value={provider.slug}>
                    {provider.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <TextField.Root
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder={`Código de seguimiento, por ejemplo: ${trackingCodeExample}`}
            className={"w-full"}
          />

          <Button type={"submit"} disabled={upsertPackage.isPending}>
            {upsertPackage.isPending ? "Registrando paquete..." : "Registrar"}
          </Button>
        </Flex>
      </form>
    </Flex>
  )
}