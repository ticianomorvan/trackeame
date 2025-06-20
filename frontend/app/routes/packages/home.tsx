import type { Route } from "./+types/home";

import { Link } from "react-router";
import { CirclePlusIcon } from "lucide-react";
import { Button, Flex, Heading } from "@radix-ui/themes";

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
        <Flex
          align={"center"}
          justify={"between"}
        >
          <Heading as={"h2"} className={"text-2xl font-bold mb-4"}>
            Tus paquetes
          </Heading>

          <Button variant={"outline"} asChild>
            <Flex
              align={"center"}
            >
              <Link to={"/packages/register"}>
                Registrar paquete
              </Link>

              <CirclePlusIcon size={16} />
            </Flex>
          </Button>
        </Flex>
        
        <DisplayPackages />
      </Flex>
    </Flex>
  );
}