// lib/maps/routeComparison/routeComparisonMock.ts
//
// Mock rota karşılaştırma üretici — lib/maps.ts'teki estimateMockDistanceKm
// ile aynı deterministik hash yaklaşımını kullanır (aynı şehir çifti için
// her zaman aynı sonucu üretir), ama iki farklı senaryo (otoyollu/otoyolsuz)
// döner.

import type { RouteComparisonResult, RoutePoint } from "./routeComparisonTypes";

function seedFromCities(origin: string, destination: string): number {
  return `${origin}-${destination}`
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Basit bir sinüs eğrisiyle, iki nokta arasında "yol gibi" görünen bir
 * eğri üretir. `waviness` arttıkça eğri daha dolambaçlı olur (otoyolsuz
 * rotayı görsel olarak ayırt etmek için).
 */
function buildCurve(seed: number, waviness: number): RoutePoint[] {
  const steps = 6;
  const points: RoutePoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = 5 + t * 90;
    const wobble = Math.sin(t * Math.PI * waviness + seed) * 10;
    const y = 50 + wobble;
    points.push({ x: round1(x), y: round1(y) });
  }

  return points;
}

export function buildMockRouteComparison(
  origin: string,
  destination: string
): RouteComparisonResult {
  const seed = seedFromCities(origin, destination);

  // lib/maps.ts'teki MockMapsProvider ile aynı aralık (80-900 km).
  const withTollsDistanceKm = 80 + (seed % 820);
  // Otoyolsuz rota tipik olarak biraz daha uzun mesafe kat eder.
  const noTollsDistanceKm = Math.round(withTollsDistanceKm * 1.06);

  const averageSpeedWithTollsKmh = 90;
  const averageSpeedNoTollsKmh = 70;

  return {
    withTolls: {
      avoidTolls: false,
      distanceKm: withTollsDistanceKm,
      durationMinutes: Math.round(
        (withTollsDistanceKm / averageSpeedWithTollsKmh) * 60
      ),
      points: buildCurve(seed, 1),
      isMocked: true,
    },
    noTolls: {
      avoidTolls: true,
      distanceKm: noTollsDistanceKm,
      durationMinutes: Math.round(
        (noTollsDistanceKm / averageSpeedNoTollsKmh) * 60
      ),
      points: buildCurve(seed + 17, 2.4),
      isMocked: true,
    },
  };
}
