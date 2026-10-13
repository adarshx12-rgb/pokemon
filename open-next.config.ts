import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Prerendered pages ship inside the deploy's static assets, so the cache costs no KV/R2 operations.
// Data refreshes on each deploy; there is no background revalidation (no queue is configured).
export default defineCloudflareConfig({
	incrementalCache: staticAssetsIncrementalCache,
});
