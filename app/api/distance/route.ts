// app/api/distance/route.ts
//
// Mesafe hesaplama için sunucu tarafı Route Handler.
//
// NEDEN BU DOSYA VAR (bkz. docs/sprint-15-technical-plan.md Bölüm 1.3):
// `app/calculator/page.tsx` bir client component'tir ve `GOOGLE_MAPS_API_KEY`
// `NEXT_PUBLIC_` önekine sahip olmadığı için (anahtarı tarayıcıya sızdırmamak
// amacıyla bilinçli bir tercih) tarayıcıda asla okunamaz. Bu yüzden gerçek
// Google Maps çağrısı burada, sunucuda yapılır; `page.tsx` yalnızca bu
// route'a `fetch` ile istek atar.
//
// Bu route ayrıca Sprint 15'te onaylanan geliştirme fallback kararının tek
// uygulama noktasıdır: `GOOGLE_MAPS_API_KEY` tanımlı değilse ve production
// dışındaysak otomatik olarak `MockMapsProvider`'a düşülür.

import { NextResponse } from "next/server";
import {
  getMapsService,
  MockMapsProvider,
  MapsApiError,
  MapsConfigError,
  MapsNotImplementedError,
  type DistanceRequest,
  type MapsProvider,
} from "../../../lib/maps";

interface DistanceRequestBody {
  origin?: unknown;
  destination?: unknown;
  avoidTolls?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Hangi Maps sağlayıcısının kullanılacağına karar verir.
 *
 * Geliştirme ortamında `GOOGLE_MAPS_API_KEY` yoksa `MockMapsProvider`
 * kullanılır (Sprint 15, "geliştirme için mock'a otomatik düşsün" kararı).
 * Aksi halde `getMapsService()` (→ gerçek `GoogleMapsProvider`) kullanılır.
 */
function resolveProvider(): MapsProvider {
  const hasApiKey = Boolean(process.env.GOOGLE_MAPS_API_KEY);

  if (!hasApiKey && process.env.NODE_ENV !== "production") {
    return new MockMapsProvider();
  }

  return getMapsService();
}

export async function POST(request: Request) {
  let body: DistanceRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi (JSON bekleniyor)." },
      { status: 400 }
    );
  }

  const { origin, destination, avoidTolls } = body;

  if (!isNonEmptyString(origin) || !isNonEmptyString(destination)) {
    return NextResponse.json(
      { error: "origin ve destination alanları zorunludur." },
      { status: 400 }
    );
  }

  const distanceRequest: DistanceRequest = {
    origin,
    destination,
    avoidTolls: avoidTolls === true,
  };

  try {
    const provider = resolveProvider();
    const result = await provider.getDistance(distanceRequest);
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
      { error: "Mesafe hesaplanırken beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}
