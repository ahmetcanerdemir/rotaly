// app/api/route-comparison/route.ts
//
// "Akıllı Rota Karşılaştırması" için sunucu tarafı Route Handler.
//
// app/api/distance/route.ts ile birebir aynı gerekçe ve desen: mesafe/rota
// çağrısı istemciden değil sunucudan yapılır (GOOGLE_MAPS_API_KEY istemcide
// okunamaz), ve GOOGLE_MAPS_API_KEY tanımlı değilken (yalnızca development
// ortamında) otomatik olarak MockRouteComparisonProvider'a düşülür.
//
// Bu endpoint yalnızca HAM rota geometrisini (mesafe/süre, iki senaryo)
// döner — maliyet hesaplaması (yakıt/HGS/toplam) burada YAPILMAZ; bu,
// lib/maps/routeComparison/compareRoutes.ts'teki saf fonksiyonla istemci
// tarafında yapılır (bkz. o dosyanın başındaki mimari not).

import { NextResponse } from "next/server";
import { MockRouteComparisonProvider } from "../../../lib/maps/routeComparison/routeComparisonProvider";
import {
  getRouteComparisonService,
  setRouteComparisonServiceForTesting,
} from "../../../lib/maps/routeComparison/routeComparisonService";
import {
  MapsApiError,
  MapsConfigError,
  MapsNotImplementedError,
} from "../../../lib/maps";
import type { RouteComparisonRequest } from "../../../lib/maps/routeComparison/routeComparisonTypes";

interface RouteComparisonRequestBody {
  origin?: unknown;
  destination?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Hangi rota karşılaştırma sağlayıcısının kullanılacağına karar verir.
 * app/api/distance/route.ts'teki resolveProvider ile aynı desen.
 */
function resolveDevFallback(): void {
  const hasApiKey = Boolean(process.env.GOOGLE_MAPS_API_KEY);

  if (!hasApiKey && process.env.NODE_ENV !== "production") {
    setRouteComparisonServiceForTesting(new MockRouteComparisonProvider());
  }
}

export async function POST(request: Request) {
  let body: RouteComparisonRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi (JSON bekleniyor)." },
      { status: 400 }
    );
  }

  const { origin, destination } = body;

  if (!isNonEmptyString(origin) || !isNonEmptyString(destination)) {
    return NextResponse.json(
      { error: "origin ve destination alanları zorunludur." },
      { status: 400 }
    );
  }

  const comparisonRequest: RouteComparisonRequest = { origin, destination };

  resolveDevFallback();

  try {
    const provider = getRouteComparisonService();
    const result = await provider.getComparison(comparisonRequest);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MapsConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (error instanceof MapsApiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    if (error instanceof MapsNotImplementedError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    return NextResponse.json(
      { error: "Rota karşılaştırması hesaplanırken beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}
