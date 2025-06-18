import type { Route } from "./+types/register";

import { Flex, Heading } from "@radix-ui/themes";

import UpsertPackage from "./components/upsert-package";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Registrar paquete" },
    { name: "description", content: "Registra un nuevo paquete para rastrear su estado y ubicación." },
  ];
}

export default function RegisterPackage() {
  return (
    <Flex
      align={"center"}
      justify={"center"}
      direction={"column"}
      width={"100%"}
      height={"100%"}
    >
      <Flex
        gap={"1rem"}
        direction={"column"}
        className={"max-w-[36rem] w-full p-6 bg-[var(--accent-surface)] rounded-lg shadow-sm"}
      >
        <Heading as={"h2"} className={"text-2xl font-bold mb-4"}>
          Registrar paquete
        </Heading>

        <Heading as={"h3"} size={"4"} weight={"regular"}>
          Seleccioná el proveedor y el código de seguimiento del paquete que querés registrar.
        </Heading>
        
        <UpsertPackage />
      </Flex>
    </Flex>
  );
}