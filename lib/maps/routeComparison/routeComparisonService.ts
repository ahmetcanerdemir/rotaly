// lib/maps/routeComparison/routeComparisonService.ts
//
// lib/maps.ts'teki getMapsService()/setMapsServiceForTesting() factory
// deseninin tekrarı.

import type { RouteComparisonProvider } from "./routeComparisonProvider";
import { GoogleRouteComparisonProvider } from "./routeComparisonProvider";

let cachedProvider: RouteComparisonProvider | null = null;

/**
 * Uygulamanın kullanacağı tek rota karşılaştırma servis örneğini döndürür.
 *
 * Yalnızca sunucu tarafında çağrılmalıdır (app/api/route-comparison/route.ts
 * içinden) — aynı gerekçeyle lib/maps.ts'teki getMapsService() de yalnızca
 * sunucuda çağrılır (GOOGLE_MAPS_API_KEY istemcide okunamaz).
 */
export function getRouteComparisonService(): RouteComparisonProvider {
  if (!cachedProvider) {
    cachedProvider = new GoogleRouteComparisonProvider();
  }
  return cachedProvider;
}

/**
 * Testlerde veya API anahtarı olmadan geliştirirken gerçek provider
 * yerine mock enjekte etmek için.
 */
export function setRouteComparisonServiceForTesting(
  provider: RouteComparisonProvider
): void {
  cachedProvider = provider;
}
