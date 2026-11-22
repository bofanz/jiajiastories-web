import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: "643n9p7z",
  dataset: "production",
  apiVersion: "2025-02-19",
  useCdn: true,
});
