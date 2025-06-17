import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  ...prefix("packages", [
    index("routes/packages/home.tsx"),
    route("register", "routes/packages/register.tsx"),
    route(":packageId", "routes/packages/package.tsx"),
  ]),
] satisfies RouteConfig;
