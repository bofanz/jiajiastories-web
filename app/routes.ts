import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  layout("routes/_layout.tsx", [
    route("stories", "routes/_layout.stories.tsx", [
      route(":slug", "routes/_layout.stories.$slug.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
