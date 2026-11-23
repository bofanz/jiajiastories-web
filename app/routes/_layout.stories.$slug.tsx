import { data, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/_layout.stories.$slug";
import { formatDateRange } from "~/lib/date";
import { SITE_TITLE } from "~/lib/site";
import { getStoryBySlug } from "~/sanity/queries.server";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://cdn.sanity.io" },
];

export async function loader({ params }: Route.LoaderArgs) {
  const story = await getStoryBySlug(params.slug);
  if (!story) {
    throw data(null, { status: 404, statusText: "Story not found" });
  }
  return data(
    { story },
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

export function meta({ loaderData }: Route.MetaArgs) {
  const story = loaderData?.story;
  if (!story) return [{ title: `Story not found | ${SITE_TITLE}` }];
  return [
    { title: `${story.name} | ${SITE_TITLE}` },
    ...(story.description
      ? [{ name: "description", content: story.description }]
      : []),
  ];
}

/**
 * Rendered width of a photo: two of six columns plus the gap between them.
 * One column = (100vw - 2×12px padding - 5×12px gaps) / 6.
 */
const PHOTO_SIZES = "calc((100vw - 84px) / 3 + 12px)";

export default function Story({ loaderData }: Route.ComponentProps) {
  const { story } = loaderData;
  const dates = formatDateRange(story.fromDate, story.toDate);

  return (
    // Spans columns 3–6 of the parent grid. Keyed by story so switching stories
    // mounts fresh images (placeholders show) instead of swapping sources in place.
    <article key={story._id} className="col-span-4 grid grid-cols-subgrid">
      <section aria-label="Photos" className="col-span-2 py-3">
        {story.photos.length > 0 && (
          <ul className="flex flex-col">
            {story.photos.map((photo, i) => {
              // The first photo is likely in the initial viewport: load it eagerly at high priority.
              const isFirst = i === 0;
              return (
                <li key={photo._id}>
                  <figure className="relative">
                    <img
                      src={photo.image.src}
                      srcSet={photo.image.srcSet}
                      sizes={PHOTO_SIZES}
                      width={photo.image.width}
                      height={photo.image.height}
                      alt={photo.description ?? ""}
                      loading={isFirst ? "eager" : "lazy"}
                      fetchPriority={isFirst ? "high" : "auto"}
                      decoding="async"
                      className="block h-auto w-full bg-cover bg-center"
                      style={
                        photo.image.lqip
                          ? { backgroundImage: `url(${photo.image.lqip})` }
                          : undefined
                      }
                    />
                    {photo.description && (
                      <figcaption className="absolute inset-x-0 bottom-0 p-3 whitespace-pre-line text-[#ff008f]">
                        {photo.description}
                      </figcaption>
                    )}
                  </figure>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="About" className="col-start-4 py-3">
        {/* Not shown on screen; kept for search engines and screen readers. */}
        <header className="sr-only">
          <h1>{story.name}</h1>
          {dates && <p>{dates}</p>}
          {story.city && <p>{story.city}</p>}
        </header>

        {story.description && (
          <p className="px-1 whitespace-pre-line">{story.description}</p>
        )}
      </section>
    </article>
  );
}

/**
 * Rendered inside the stories layout, so the list stays on screen and the
 * visitor can pick another story.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <section className="col-span-4 px-1">
      <h1>{notFound ? "Story not found" : "Something went wrong"}</h1>
    </section>
  );
}
