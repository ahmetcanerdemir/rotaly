// lib/tolls/tollProvider.ts
//
// lib/maps.ts (MapsProvider) ve lib/fuel/ (FuelPriceProvider) ile aynı
// Provider deseni: bir arayüz + değiştirilebilir implementasyon(lar) +
// test için factory override'ı.

import { calculateToll } from "./tollCalculator";
import type { TollCalculationResult, TollRouteInput } from "./types";

export interface TollProvider {
  calculate(input: TollRouteInput): TollCalculationResult;
}

/** V1 örnek başlangıç veri setini (bkz. tollData.ts) kullanan gerçek provider. */
export class StaticTollProvider implements TollProvider {
  calculate(input: TollRouteInput): TollCalculationResult {
    return calculateToll(input);
  }
}

/**
 * Her zaman "veri yok" sonucu döner. Testlerde veya toll verisinin
 * bilerek devre dışı bırakılması gereken durumlarda kullanılır.
 */
export class EmptyTollProvider implements TollProvider {
  calculate(_input: TollRouteInput): TollCalculationResult {
    void _input;
    return {
      segments: [],
      oneWayTotal: 0,
      roundTripTotal: 0,
      total: null,
      currency: "TRY",
      status: "unavailable",
      tariffDate: null,
      warnings: ["EmptyTollProvider: veri kaynağı yapılandırılmadı."],
    };
  }
}

let activeProvider: TollProvider = new StaticTollProvider();

export function getTollProvider(): TollProvider {
  return activeProvider;
}

/** Testlerde farklı bir provider (ör. EmptyTollProvider) enjekte etmek için. */
export function setTollProviderForTesting(provider: TollProvider): void {
  activeProvider = provider;
}
