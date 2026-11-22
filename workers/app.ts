import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

/**
 * Responses from a Worker aren't cached by Cloudflare's CDN on their own, so
 * store cacheable pages in the edge cache ourselves. The cache honours the
 * response's Cache-Control (s-maxage, else max-age) for how long to keep it.
 *
 * Note: the Cache API only works on a custom domain; on *.workers.dev it is a
 * no-op, so every request renders.
 */
async function handleWithEdgeCache(request: Request, ctx: ExecutionContext) {
	// Skip in dev so edits show immediately, and for anything but GET.
	if (import.meta.env.DEV || request.method !== "GET") {
		return requestHandler(request);
	}

	// tsconfig also loads the DOM lib, whose CacheStorage lacks Cloudflare's
	// `default` cache, so spell out the type here.
	const cache = (caches as CacheStorage & { default: Cache }).default;
	const cached = await cache.match(request);
	if (cached) return cached;

	const response = await requestHandler(request);
	const cacheControl = response.headers.get("Cache-Control") ?? "";
	if (response.status === 200 && /\bpublic\b/.test(cacheControl)) {
		ctx.waitUntil(cache.put(request, response.clone()));
	}
	return response;
}

export default {
	async fetch(request, _env, ctx) {
		return handleWithEdgeCache(request, ctx);
	},
} satisfies ExportedHandler<Env>;
