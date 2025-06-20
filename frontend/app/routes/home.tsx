import type { Route } from "./+types/home";
import { toast } from "sonner";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useMediaQuery } from "usehooks-ts";
import { signInWithPopup } from "firebase/auth";
import { ArrowRightIcon, TruckIcon } from "lucide-react";
import { Button, Flex, Heading, Link, Strong, Text } from "@radix-ui/themes";

import { auth } from "utils/firebase";
import { useAuth } from "contexts/auth-context";
import { googleAuthProvider } from "utils/auth";

import { PROVIDER_LOGOS } from "./constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Trackeame" },
    {
      name: "description",
      content: "Trackeame te permite centralizar los envíos que vas a recibir a través de diferentes plataformas como Correo Argentino, Andreani, OCA, entre otras."
    },
  ];
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleRegister = useCallback(() => {
    if (!user) {
      // If the user is not logged in, prompt Google sign-in
      toast.promise(
        signInWithPopup(auth, googleAuthProvider),
        {
          loading: "Termina de iniciar sesión en la ventana...",
          success: "Has iniciado sesión correctamente.",
          error: "Error al iniciar sesión. Inténtalo de nuevo más tarde."
        }
      )
    } else {
      // If the user is already logged in, navigate to the packages page
      navigate("/packages")
    }

  }, [user])

  return (
    <Flex
      p={{ initial: "1rem", xs: "4rem", sm: "2rem", lg: "0rem" }}
      gap={"2rem"}
      align={"center"}
      justify={"center"}
      direction={"column"}
    >
      <div className={"min-h-[24rem] mt-36 flex items-center justify-center gap-x-4"} /* HERO COMPONENT */>
        <Flex
          gap={"2.5rem"}
          align={"center"}
          justify={"center"}
          direction={"column"}
          className={"max-w-screen-lg"}
        >
          <Heading
            as={"h1"}
            size={"9"}
            className={"max-w-[24ch] text-center"}
          >
            Que no te manden a buscar tu paquete a la sucursal.
          </Heading>

          <Heading
            as={"h2"}
            size={"6"}
            weight={"regular"}
            className={"max-w-[48ch] text-center"}
          >
            Con <Strong>Trackeame</Strong> tenés todos tus envíos en un solo lugar y notificaciones en tiempo real, para que no te pierdas de nada.
          </Heading>

          <Flex
            gap={"1.25rem"}
            align={"center"}
            hidden={isMobile}
            className={"w-fit bg-[var(--accent-surface)] py-2 px-4 rounded-lg shadow-sm"}
          >
            <Flex
              gap={"0.5rem"}
              align={"center"}
            >
              <TruckIcon color={"var(--accent-a11)"} className={"hidden md:block"} /> 

              <Text color={"lime"}>
                Seguí tus envíos de las plataformas que ya usás
              </Text>
            </Flex>

            <Flex
              gap={"0.25rem"}
              align={"center"}
            >
              {Object.values(PROVIDER_LOGOS).map((src) => (
                <img
                  key={src}
                  src={src}
                  alt="Provider Logo"
                  className="w-20 h-8 object-contain"
                />
              ))}
            </Flex>
          </Flex>

          <Flex
            gap={"1.5rem"}
            align={"center"}
            direction={{
              initial: "column-reverse",
              xs: "row",
            }}
          >
            <Flex
              gap={"0.875rem"}
              align={"center"}
            >
              <img src={"/google.svg"} alt="Google Logo" className="w-5 h-5" />

              <Text
                color={"gray"}
              >
                Empezá gratis con tu cuenta de Google
              </Text>
            </Flex>

            <Button
              size={"3"}
              onClick={handleRegister}
            >
              Cargá tus pedidos
              <ArrowRightIcon size={18} />
            </Button>
          </Flex>
        </Flex>
      </div>

      <Flex
        gap={"4rem"}
        align={"center"}
        justify={"center"}
        className={"mt-8 flex-col md:flex-row"}
      >
        <Flex
          gap={"1rem"}
          direction={"column"}
        >
          <Heading
            as={"h2"}
            size={"8"}
          >
            Todos tus pedidos en un solo lugar
          </Heading>

          <Text
            size={"6"}
            className={"max-w-[48ch]"}
          >
            Sin necesidad de guardar los correos o los códigos de seguimiento.
            <br /><br />
            Con Trackeame podés registrar tus pedidos de forma rápida y sencilla, y tener acceso a su estado y ubicación en tiempo real.
          </Text>
        </Flex>

        <img
          src={"/screenshot-packages.png"}
          alt={"Hero Image"}
          className={"max-w-md w-full h-auto rounded-lg object-cover"}
        />
      </Flex>

      <Flex
        gap={"4rem"}
        align={"center"}
        justify={"center"}
        className={"mt-8 flex-col md:flex-row-reverse"}
      >
        <Flex
          gap={"1rem"}
          direction={"column"}
        >
          <Heading
            as={"h2"}
            size={"8"}
            align={{ initial: "left", sm: "right" }}
          >
            No te pierdas de ningún detalle
          </Heading>

          <Text
            size={"6"}
            align={{ initial: "left", sm: "right" }}
            className={"max-w-[48ch]"}
          >
            Llevá la pista de cada paso  de tu pedido, desde que sale del vendedor hasta que llega a tu puerta.
            <br /><br />
            <Strong>Que no digan que te visitaron y no los recibiste.</Strong>
          </Text>
        </Flex>

        <img
          src={"/screenshot-history.png"}
          alt={"Hero Image"}
          className={"max-w-md w-full h-auto rounded-lg object-cover"}
        />
      </Flex>

      <Flex
        gap={"2rem"}
        align={"center"}
        justify={"center"}
        className={"my-8"}
        direction={"column"}
      >
        <Heading
          as={"h2"}
          size={"8"}
          align={"center"}
        >
          ¿Empezamos a seguir tus envíos?
        </Heading>

        <Text
          size={"4"}
          className="max-w-[48ch] text-center"
        >
          Registrá gratis tus envíos de las plataformas que ya usás y empezá a recibir notificaciones en tiempo real.
        </Text>

        <Button size={"3"} onClick={handleRegister}>
          Registrá tus pedidos gratis
        </Button>
      </Flex>

      <footer className="w-full">
        <Flex
          p={"1rem"}
          gap={"0.25rem"}
          width={"100%"}
          align={"center"}
          justify={"center"}
          className={"bg-[var(--accent-surface)]"}
        >
          <Text size={"2"} color={"gray"}>
            &copy; {new Date().getFullYear()} Trackeame. Todos los derechos reservados.
          </Text>

          <Text size={"2"} color={"gray"}>
            Desarrollado por{" "}
            <Link
              href={"https://ticianomorvan.com"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ticiano Morvan
            </Link>
          </Text>
        </Flex>
      </footer>
    </Flex>
  );
}

