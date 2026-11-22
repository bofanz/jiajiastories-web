import { createImageUrlBuilder } from "@sanity/image-url";
import type { Photo, SanityImageCrop } from "./sanity.types";
import { sanityClient } from "./client.server";

const builder = createImageUrlBuilder(sanityClient);

/**
 * Widths offered in srcset. The browser picks the smallest one that covers the
 * rendered width × device pixel ratio, so 1x screens get ~480–640 and 2x
 * screens get up to 1280.
 */
const WIDTHS = [320, 480, 640, 800, 960, 1280] as const;

/** Fallback `src` for browsers without srcset support; also sets the aspect box. */
const FALLBACK_WIDTH = 800;

export type PhotoImageSource = NonNullable<Photo["image"]> & {
  asset?: {
    _id: string;
    metadata?: {
      lqip?: string;
      dimensions?: { width?: number; height?: number };
    };
  };
};

export type ResponsiveImage = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  lqip?: string;
};

/** Intrinsic size after the editor's crop is applied. */
function croppedSize(
  width: number,
  height: number,
  crop?: SanityImageCrop,
): [number, number] {
  const w = width * (1 - (crop?.left ?? 0) - (crop?.right ?? 0));
  const h = height * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0));
  return [Math.round(w), Math.round(h)];
}

export function buildResponsiveImage(
  image: PhotoImageSource | undefined,
): ResponsiveImage | null {
  if (!image?.asset?._id) return null;
  const { asset } = image;
  const dims = asset.metadata?.dimensions;
  if (!dims?.width || !dims?.height) return null;

  const [cw, ch] = croppedSize(dims.width, dims.height, image.crop);
  const url = (w: number) =>
    builder
      .image({ ...image, asset: { _ref: asset._id } })
      .width(Math.min(w, cw))
      .fit("max")
      .auto("format")
      .url();

  // Never upscale: keep widths smaller than the original, and when the original
  // is narrower than the top step, offer it at full size as the largest option.
  const widths: number[] = WIDTHS.filter((w) => w < cw);
  if (cw <= WIDTHS[WIDTHS.length - 1]) widths.push(cw);

  const displayWidth = Math.min(FALLBACK_WIDTH, cw);
  return {
    src: url(displayWidth),
    srcSet: widths.map((w) => `${url(w)} ${w}w`).join(", "),
    width: displayWidth,
    height: Math.round((displayWidth * ch) / cw),
    lqip: asset.metadata?.lqip,
  };
}
