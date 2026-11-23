import {
  data,
  NavLink,
  Outlet,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import type { Route } from "./+types/_layout.stories";
import { formatDateRange } from "~/lib/date";
import { SITE_TITLE } from "~/lib/site";
import { getStoryList } from "~/sanity/queries.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: SITE_TITLE }];
}

export async function loader() {
  return data(
    { stories: await getStoryList() },
    {
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      },
    },
  );
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

/**
 * The list doesn't depend on which story is open, so skip refetching it when
 * navigating between stories. Still revalidate after form submissions.
 */
export function shouldRevalidate({
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  return formMethod ? defaultShouldRevalidate : false;
}

type StoryListItem = Route.ComponentProps["loaderData"]["stories"][number];

/** One line of the list: name, city, date — highlighted and bracketed when open. */
function StoryLine({ story, isCurrent }: { story: StoryListItem; isCurrent: boolean }) {
  return (
    <span className={isCurrent ? "text-[#ff008f]" : undefined}>
      {isCurrent && "("}
      {`${story.name}, ${story.city}, ${formatDateRange(story.fromDate, story.toDate)}`}
      {isCurrent && ")"}
    </span>
  );
}

export default function Stories({ loaderData, params }: Route.ComponentProps) {
  // The slug of the open story, from the URL; undefined on the list page.
  const currentSlug = "slug" in params ? params.slug : undefined;

  return (
    // Six columns: list (1–2), photos (3–4), empty (5), description (6).
    // The page itself scrolls with the story; the list sticks to the viewport
    // and scrolls on its own if it's taller than the screen.
    <div className="grid grid-cols-6 items-start gap-3 px-3">
      <ul className="story-list sticky top-0 col-span-2 max-h-[calc(100dvh-1.5rem)] overflow-y-auto py-3">
        {loaderData.stories.map((story) => (
          <li key={story._id}>
            <NavLink to={`/stories/${story.slug}`}>
              <StoryLine story={story} isCurrent={story.slug === currentSlug} />
            </NavLink>
          </li>
        ))}
      </ul>
      <Outlet />
    </div>
  );
}
