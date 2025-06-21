import type { Route } from "./+types/package";
import type { Package } from "types/package";

import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, TrashIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { AlertDialog, Button, Flex, Heading, Text } from "@radix-ui/themes";

import { ResponseType } from "types/response";
import { useAuth } from "contexts/auth-context";
import { fetcher } from "utils/fetch";

import PackageHistory from "./components/package-history";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Rastrear paquete: ${params.packageId}` },
    { name: "description", content: `Rastrear el paquete con ID: ${params.packageId}` },
  ];
}

export default function TrackPackage() {
  const auth = useAuth()
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const deletePackageMutation = useMutation({
    mutationKey: ["deletePackage", params.packageId],
    mutationFn: async () => {
      if (!params.packageId) {
        throw new Error("Se necesita un ID de paquete para eliminarlo.");
      }

      if (!auth.user) {
        throw new Error("Por favor, inicia sesión para eliminar un paquete.");
      }

      const idToken = await auth.user.getIdToken();
      
      const response = await fetcher<Package>(`/packages/${params.packageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (response.status === ResponseType.Error) {
        console.error(response.message);

        throw new Error(response.message || "Error al eliminar el paquete.");
      }

      return response.data;
    },
    onSuccess: (deletedPackage) => {
      queryClient.setQueryData(["packages"], (oldData: Package[] | undefined) => {
        if (!oldData) return [];

        return oldData.filter((pkg) => pkg.id !== deletedPackage.id);
      })
    }
  })

  const handleDeletePackage = () => {
    toast.promise(deletePackageMutation.mutateAsync(), {
      loading: "Eliminando paquete...",
      success: () => {
        navigate("/packages");
        return "Paquete eliminado correctamente.";
      },
      error: (error) => `Error al eliminar el paquete: ${error.message}`,
    })
  }

  return (
    <Flex
      width={"100%"}
      height={"100%"}
      align={"center"}
      justify={"center"}
      direction={"column"}
    >
      <Flex
        gap={"1rem"}
        direction={"column"}
        className={"max-w-2xl w-full h-full p-6 bg-[var(--accent-surface)] rounded-lg shadow-sm sm:h-fit"}
      >
        <Flex
          align={"center"}
          justify={"between"}
        >
          <Link to={"/packages"}>
            <Flex
              gap={"0.5rem"}
              align={"center"}
            >
              <ArrowLeftIcon size={16} /> Volver atrás
            </Flex>
          </Link>

          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button color={"red"}>
                <TrashIcon size={16} />
              </Button>
            </AlertDialog.Trigger>

            <AlertDialog.Content>
              <AlertDialog.Title>Vas a eliminar este paquete.</AlertDialog.Title>
              <AlertDialog.Description>
                Esta acción no se puede deshacer, para volver a rastrear el paquete, deberás registrarlo nuevamente.
              </AlertDialog.Description>

              <Flex
                mt={"1rem"}
                gap={"0.875rem"}
                align={"center"}
                justify={"end"}
              >
                <AlertDialog.Cancel>
                  <Button variant={"soft"} color={"gray"}>
                    Cancelar
                  </Button>
                </AlertDialog.Cancel>

                <AlertDialog.Action>
                  <Button
                    color={"red"}
                    onClick={handleDeletePackage}
                  >
                    Eliminar paquete
                  </Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </Flex>
        
        <PackageHistory />
      </Flex>
    </Flex>
  );
}