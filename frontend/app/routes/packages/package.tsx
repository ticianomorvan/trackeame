import type { Route } from "./+types/package";

import { Flex, Heading } from "@radix-ui/themes";

import PackageHistory from "./components/package-history";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Rastrear paquete: ${params.packageId}` },
    { name: "description", content: `Rastrear el paquete con ID: ${params.packageId}` },
  ];
}

export default function TrackPackage() {
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
        <Flex
          gap={"0.5rem"}
          align={"center"}
        >
          <Link to={"/packages"}>
            <ArrowLeftIcon size={16} />
          </Link>

          <Heading as="h2" className="text-2xl font-bold mb-4">
            Rastreá tu paquete
          </Heading>
        </Flex>
        
        <PackageHistory />
      </Flex>
    </Flex>
  );
}