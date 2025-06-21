import type { Route } from "./+types/home";

import { Link } from "react-router";
import { useMediaQuery } from "usehooks-ts";
import { CirclePlusIcon } from "lucide-react";
import { Button, Flex, Heading, Text } from "@radix-ui/themes";

import DisplayPackages from "./components/display-packages";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tus paquetes" },
    { name: "description", content:  "Consulta el estado de tus paquetes y envíos." },
  ]
}

export default function Packages() {
  const isMobile = useMediaQuery("(max-width: 768px)");

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
        className={"max-w-[36rem] w-full h-full p-6 bg-[var(--accent-surface)] rounded-lg shadow-sm sm:h-fit"}
      >
        <Flex
          align={"center"}
          justify={"between"}
        >
          <Heading as={"h2"} className={"text-2xl font-bold mb-4"}>
            Tus paquetes
          </Heading>

          <Link to={"/packages/register"}>
            <Button variant={"outline"}>
              <Text hidden={isMobile}>
                Registrar paquete
              </Text>

              <CirclePlusIcon size={16} />
            </Button>
          </Link>
        </Flex>
        
        <DisplayPackages />
      </Flex>
    </Flex>
  );
}