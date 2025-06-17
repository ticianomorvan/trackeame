import type { Route } from "./+types/home";

import { Flex, Heading } from "@radix-ui/themes";

import DisplayPackages from "./components/display-packages";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tus paquetes" },
    { name: "description", content:  "Consulta el estado de tus paquetes y envíos." },
  ]
}

export default function Packages() {
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
        className={"max-w-[36rem] w-full p-6 bg-[var(--accent-surface)] rounded-lg shadow-sm"}
      >
        <Heading as="h1" className="text-2xl font-bold mb-4">
          Tus paquetes
        </Heading>
        
        <DisplayPackages />
      </Flex>
    </Flex>
  );
}