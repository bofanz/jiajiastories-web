import { Link, Outlet } from "react-router";
import { SITE_TITLE } from "~/lib/site";

export default function Layout() {
  return (
    <main>
      <Outlet />
    </main>
  );
}
