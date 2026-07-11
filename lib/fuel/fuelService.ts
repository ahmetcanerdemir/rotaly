// lib/fuel/fuelService.ts
//
// Fuel Price Service — dışa açılan tek giriş noktası.
//
// `lib/maps.ts`'teki `getMapsService()`/`setMapsServiceForTesting()`
// factory deseniyle birebir aynı: uygulamanın geri kalanı yalnızca
// `getFuelPriceService()`/`getFuelPrice()` çağırır, hangi provider'ın
// (manuel config veya ileride canlı API) aktif olduğunu bilmesi gerekmez.
//
// ÖNEMLİ (bkz. docs/sprint-15-technical-plan.md Bölüm 2.3): Bu servis bu
// sprintte `lib/costs.ts`'e BAĞLANMIYOR. `calculateFuelCost` hâlâ kendi
// `DEFAULT_FUEL_PRICES` sabitini kullanıyor. Bu dosya şimdilik bağımsız,
// hazır ama pasif bir modül olarak duruyor.

import type { FuelPrice, FuelType } from "./fuelTypes";
import { ConfigFuelPriceProvider, type FuelPriceProvider } from "./fuelProvider";

let cachedProvider: FuelPriceProvider | null = null;

/**
 * Uygulamanın kullanacağı tek Fuel Price Service örneğini döndürür.
 */
export function getFuelPriceService(): FuelPriceProvider {
  if (!cachedProvider) {
    cachedProvider = new ConfigFuelPriceProvider();
  }
  return cachedProvider;
}

/**
 * Testlerde veya gerçek API bağlanana kadar farklı bir provider enjekte
 * etmek için.
 */
export function setFuelPriceServiceForTesting(provider: FuelPriceProvider): void {
  cachedProvider = provider;
}

/**
 * Kolaylık fonksiyonu: doğrudan fiyat isteği yapmak için.
 */
export function getFuelPrice(fuelType: FuelType, city?: string): Promise<FuelPrice> {
  return getFuelPriceService().getPrice({ fuelType, city });
}
