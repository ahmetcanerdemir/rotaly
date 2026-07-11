// lib/tolls/tollTariffService.ts
//
// lib/maps.ts'teki getMapsService()/setMapsServiceForTesting() ve
// lib/fuel/fuelService.ts'teki aynı desenin tekrarı: uygulamanın geri
// kalanı yalnızca bu factory'yi çağırır, hangi provider'ın aktif olduğunu
// bilmesi gerekmez.

import type { TollTariffProvider } from "./tollTariffProvider";
import { CuratedTollTariffProvider } from "./tollTariffProvider";

let cachedProvider: TollTariffProvider | null = null;

export function getTollTariffService(): TollTariffProvider {
  if (!cachedProvider) {
    cachedProvider = new CuratedTollTariffProvider();
  }
  return cachedProvider;
}

/**
 * Testlerde farklı bir provider (ör. daha geniş kapsamlı bir kürasyonlu
 * tablo) enjekte etmek için.
 */
export function setTollTariffServiceForTesting(provider: TollTariffProvider): void {
  cachedProvider = provider;
}
