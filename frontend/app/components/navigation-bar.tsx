import { Link } from "react-router";
import { signInWithPopup } from "firebase/auth";
import { LogInIcon, LogOutIcon, PackageIcon, TruckIcon } from "lucide-react"
import { Avatar, Button, DropdownMenu, Flex, Heading, Text } from "@radix-ui/themes";

import { googleAuthProvider } from "utils/auth";
import { useAuth } from "~/contexts/auth-context";
import { auth } from "utils/firebase";

export default function NavigationBar() {
  const { user } = useAuth();
  
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50"
    >
      <Flex
        p={"1rem"}
        width={"100%"}
        align={"center"}
        direction={"row"}
        justify={"between"}
        className={"max-h-16 bg-[var(--accent-surface)]"}
      >
        <Flex
          gap={"1rem"}
          align={"center"}
        >
          <Link to={"/"}>
            <Heading as="h1">
              Trackeame
            </Heading>
          </Link>

          {user && (
            <ul>
              <Flex
                gap={"1rem"}
                align={"center"}
              >
                <li>
                  <Link to="/packages">
                    <Flex align={"center"} gap={"0.5rem"}>
                      <PackageIcon size={14} color={"var(--accent-a11)"} />
                      <Text color={"lime"}>Mis paquetes</Text>
                    </Flex>
                  </Link>
                </li>

                <li>
                  <Link to={"/packages/register"}>
                    <Flex
                      align={"center"}
                      gap={"0.5rem"}
                      className={"bg-[var(--accent-9)] hover:bg-[var(--accent-10)] px-2 py-1 rounded"}
                    >
                      <TruckIcon size={14} color={"var(--accent-a11)"} />
                      <Text color={"lime"}>Registrar paquete</Text>
                    </Flex>
                  </Link>
                </li>
              </Flex>
            </ul>
          )}
        </Flex>

        {user
          ? <UserAvatar />
          : <RedirectToLogin />
        }
      </Flex>
    </nav>
  )
}

function RedirectToLogin() {
  const handleLogin = () => {
    signInWithPopup(auth, googleAuthProvider)
      .then((result) => console.log(result.user))
      .catch((error) => {
        console.error("Error during sign-in:", error);
        // Handle error appropriately, e.g., show a notification to the user
      });
  }

  return (
    <Button onClick={handleLogin} variant="solid">
      <Text>Iniciar sesión</Text>
      <LogInIcon size={14} />
    </Button>
  )
}

function UserAvatar() {
  const { user } = useAuth();

  if (!user) return null;

  const handleLogout = () => auth.signOut()

  const avatarFallback = user.displayName
    ? user.displayName.split(" ").map(name => name[0]).join("")
    : "N/A";

  return (
    <Flex
      gap={"1rem"}
      align={"center"}
    >
      <Text>
        ¡Hola, {user.displayName || "Usuario"}! 👋
      </Text>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Avatar
            src={user.photoURL || ""}
            alt={user.displayName || "Avatar"}
            size={"2"}
            radius={"full"}
            fallback={avatarFallback}
            className="cursor-pointer"
          />
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          <DropdownMenu.Item
            color={"red"}
            onSelect={handleLogout}
          >
            <Flex align={"center"} gap={"0.5rem"}>
              Cerrar sesión
              <LogOutIcon size={14} />
            </Flex>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Flex>
  )
}