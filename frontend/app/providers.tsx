import type { ReactNode } from "react";

import { Theme } from "@radix-ui/themes";
import { useNavigate } from "react-router";
import { Auth0Provider } from "@auth0/auth0-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { env } from "utils/env";

const queryClient = new QueryClient()

export default function Providers({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const onRedirectCallback = (appState?: { returnTo?: string }) => {
    navigate(appState?.returnTo || "/", { replace: true });
  }

  return (
    <Theme /* Radix theme provider */
      radius={"large"}
      grayColor={"sand"}
      accentColor={"lime"}
      className={"h-full w-full"}
    >
      <Auth0Provider
        domain={env.VITE_AUTH0_DOMAIN}
        clientId={env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          audience: env.VITE_AUTH0_AUDIENCE,
          redirect_uri: window.location.origin,
          scope: "openid profile email offline_access",
        }}
        useRefreshTokens
        cacheLocation={"memory"}
        onRedirectCallback={onRedirectCallback}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Auth0Provider>
    </Theme>
  )
}