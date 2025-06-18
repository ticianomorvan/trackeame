import type { ReactNode } from "react";

import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./contexts/auth-context";

const queryClient = new QueryClient()

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Theme /* Radix theme provider */
      radius={"large"}
      grayColor={"sand"}
      accentColor={"lime"}
      className={"h-full w-full"}
    >
      <Toaster /* Sonner toast notifications */
        position={"bottom-right"}
        richColors
        closeButton
      />

      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </Theme>
  )
}