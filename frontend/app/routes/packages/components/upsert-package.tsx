import { z } from "zod";
import { toast } from "sonner";
import { Link } from "react-router";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BadgeCheckIcon, TriangleAlertIcon } from "lucide-react";
import { Button, Callout, Flex, Select, Spinner, Text, TextField } from "@radix-ui/themes";

import type { PackageWithProvider } from "types/package";
import type { Provider } from "types/provider";

import { ResponseType } from "types/response";
import { ProviderSlug } from "types/provider";
import { fetcher } from "utils/fetch";

import { useAuth } from "contexts/auth-context";
import { PROVIDER_LOGOS } from "~/routes/constants";

interface UpsertPackageMutationVariables {
  trackingCode: string;
  providerSlug: string;
}

const MIN_TRACKING_CODE_LENGTH = 15; // Minimum length for tracking codes
const MAX_TRACKING_CODE_LENGTH = 23; // Maximum length for tracking codes

const formSchema = z.object({
  providerSlug: z.string().min(1, "Por favor, seleccioná un proveedor."),
  trackingCode: z.string()
    .min(MIN_TRACKING_CODE_LENGTH, "El código de seguimiento debe tener al menos 15 caracteres.")
    .max(MAX_TRACKING_CODE_LENGTH, "El código de seguimiento no puede tener más de 23 caracteres."),
})

type FormSchema = z.infer<typeof formSchema>;
  
export default function UpsertPackage() {
  const auth = useAuth();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { providerSlug: "", trackingCode: "" },
  })

  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      if (!auth.user) {
        throw new Error("Por favor, inicia sesión para continuar.");
      }

      const idToken = await auth.user.getIdToken()

      const response = await fetcher<Provider[]>("/providers", {
        headers: { Authorization: `Bearer ${idToken}` }
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
      if (!auth.user) {
        throw new Error("Por favor, inicia sesión para continuar.");
      }

      const idToken = await auth.user.getIdToken()

      const response = await fetcher<PackageWithProvider>("/packages", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
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

  const onSubmit: SubmitHandler<FormSchema> = ({ providerSlug, trackingCode }) => {
    // TODO: remove when OCA support is ready
    if (providerSlug === ProviderSlug.OCA) {
      toast.error("El soporte de OCA está en proceso. Por favor, seleccioná otro proveedor.");
    
      return;
    }

    toast.promise(upsertPackage.mutateAsync({ trackingCode, providerSlug }), {
      loading: "Registrando paquete...",
      success: () => {
        form.reset(); // Reset the form after successful registration
        return "Paquete registrado correctamente!";
      },
      error: (error) => `Error al registrar el paquete: ${error.message}`,
    })
  }

  const watchProviderSlug = form.watch("providerSlug");

  const trackingCodeExample = useMemo(() => {
    switch (watchProviderSlug) {
      case ProviderSlug.CORREO_ARGENTINO:
        return "00008945903AEAX1CL02302";
      case ProviderSlug.ANDREANI:
        return "360002423941550";
      case ProviderSlug.OCA:
        return "6177500000000645550";
      default:
        return "0000000000000000";
    }
  }, [watchProviderSlug]);

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

      {(form.formState.errors.providerSlug || form.formState.errors.trackingCode) && (
        <Callout.Root color={"red"}>
          <Callout.Icon>
            <TriangleAlertIcon size={16} />
          </Callout.Icon>

          <Callout.Text>
            {
              form.formState.errors.providerSlug?.message ||
              form.formState.errors.trackingCode?.message ||
              "Por favor, completa todos los campos correctamente."
            }
          </Callout.Text>
        </Callout.Root>
      )}
          
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Flex
          gap={"1rem"}
          direction={"column"}
        >
          <Flex
            gap={"0.5rem"}
            align={{ initial: "start", sm: "center" }}
            direction={{ initial: "column", sm: "row" }}
          >
            <Flex
              gap={"0.5rem"}
              align={"center"}
            >
              {watchProviderSlug && (
                <img
                  src={PROVIDER_LOGOS[watchProviderSlug as ProviderSlug]}
                  alt="Provider Logo"
                  className="w-20 h-8 object-contain"
                />
              )}

              <Select.Root
                value={watchProviderSlug}
                onValueChange={(value) => form.setValue("providerSlug", value)}
                {...form.register("providerSlug")}
              >
                <Select.Trigger placeholder={"Seleccioná un proveedor"} />

                <Select.Content>
                  {providers.data?.map((provider: Provider) => (
                    <Select.Item
                      key={provider.id}
                      value={provider.slug}
                    >
                      {provider.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>

            <TextField.Root
              id={"tracking-code"}
              className={"my-4 w-full grow md:w-fit"}
              aria-label={"Código de seguimiento"}
              placeholder={`Ej. ${trackingCodeExample}`}
              {...form.register("trackingCode")}
            />
          </Flex>

          <Button type={"submit"} disabled={upsertPackage.isPending}>
            {upsertPackage.isPending ? "Registrando paquete..." : "Registrar"}
          </Button>
        </Flex>
      </form>
    </Flex>
  )
}