import type { City, Photo, Story } from "./sanity.types";
import { sanityClient } from "./client.server";
import {
  buildResponsiveImage,
  type PhotoImageSource,
  type ResponsiveImage,
} from "./image.server";

export type StoryListItem = Pick<Story, "_id" | "name" | "fromDate" | "toDate"> & {
  slug: string;
  city: City["name"] | null;
};

const STORY_LIST_QUERY = `*[_type == "story" && defined(slug.current)] | order(fromDate asc) {
  _id,
  name,
  fromDate,
  toDate,
  "slug": slug.current,
  "city": city->name
}`;

export function getStoryList() {
  return sanityClient.fetch<StoryListItem[]>(STORY_LIST_QUERY);
}

const STORY_BY_SLUG_QUERY = `*[_type == "story" && slug.current == $slug][0] {
  _id,
  name,
  description,
  fromDate,
  toDate,
  "city": city->name,
  "photos": photos[]-> {
    _id,
    description,
    image {
      crop,
      hotspot,
      asset-> { _id, metadata { lqip, dimensions { width, height } } }
    }
  }
}`;

type StoryBySlugResult =
  | (Pick<Story, "_id" | "name" | "description" | "fromDate" | "toDate"> & {
      city: City["name"] | null;
      photos:
        | Array<Pick<Photo, "_id" | "description"> & { image?: PhotoImageSource }>
        | null;
    })
  | null;

export type StoryPhoto = Pick<Photo, "_id" | "description"> & {
  image: ResponsiveImage;
};

export async function getStoryBySlug(slug: string) {
  const story = await sanityClient.fetch<StoryBySlugResult>(STORY_BY_SLUG_QUERY, { slug });
  if (!story) return null;

  const photos: StoryPhoto[] = [];
  for (const photo of story.photos ?? []) {
    // Dereferenced photos can be null if the referenced document was deleted.
    if (!photo) continue;
    const image = buildResponsiveImage(photo.image);
    if (image) photos.push({ _id: photo._id, description: photo.description, image });
  }

  return { ...story, photos };
}
