// lib/maps/routeComparison/routeComparisonProvider.ts
//
// lib/maps.ts'teki MapsProvider deseninin tekrarı: bir arayüz +
// değiştirilebilir implementasyonlar (Mock / Google).

import { getMapsConfig, MapsNotImplementedError } from "../../maps";
import { buildMockRouteComparison } from "./routeComparisonMock";
import type {
  RouteComparisonRequest,
  RouteComparisonResult,
} from "./routeComparisonTypes";

export interface RouteComparisonProvider {
  getComparison(
    request: RouteComparisonRequest
  ): Promise<RouteComparisonResult>;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockRouteComparisonProvider implements RouteComparisonProvider {
  async getComparison(
    request: RouteComparisonRequest
  ): Promise<RouteComparisonResult> {
    // Gerçek bir API çağrısının gecikmesini simüle eder (lib/maps.ts'teki
    // MockMapsProvider ile aynı gerekçe).
    await wait(500);
    return buildMockRouteComparison(request.origin, request.destination);
  }
}

// ---------------------------------------------------------------------------
// Google implementation — henüz stub (gerçek çağrı yapmıyor)
// ---------------------------------------------------------------------------
//
// Bkz. docs/feature-akilli-rota-karsilastirmasi.md Bölüm 3.5: gerçek
// entegrasyon, Routes API'nin `computeRoutes` uç noktasına iki paralel
// istek atacak (biri routeModifiers.avoidTolls: false, biri true),
// field mask: routes.duration, routes.distanceMeters,
// routes.polyline.encodedPolyline. Dönen encoded polyline decode edilip
// RoutePoint[]'e çevrilecek. Bu, gerçek bir GOOGLE_MAPS_API_KEY ile
// doğrulanana kadar (bkz. Bölüm 3.5'teki açık nokta) kasıtlı olarak
// bağlanmadı.

export class GoogleRouteComparisonProvider implements RouteComparisonProvider {
  async getComparison(
    request: RouteComparisonRequest
  ): Promise<RouteComparisonResult> {
    void request;

    // Anahtar eksikse burada erken ve net bir hata alırız; ama yine de
    // ağ çağrısı yapmayız (henüz kasıtlı olarak devre dışı).
    getMapsConfig();

    throw new MapsNotImplementedError(
      "Akıllı Rota Karşılaştırması için Routes API entegrasyonu henüz bağlanmadı."
    );
  }
}
