// lib/fuel/fuelProvider.ts
//
// Fuel Price Service — provider katmanı.
//
// `lib/maps.ts`'teki kanıtlanmış `MapsProvider` deseniyle birebir aynı
// şekilde tasarlandı: bir arayüz + değiştirilebilir implementasyonlar.
// Gerçek bir fiyat API'si bağlanacağı zaman, bu arayüzü uygulayan yeni
// bir `LiveFuelPriceProvider` eklenecek; bu dosyayı çağıran kodun
// (fuelService.ts ve ötesi) hiçbir şeyini değiştirmesi gerekmeyecek.

import type { FuelPrice, FuelPriceRequest } from "./fuelTypes";
import {
  MANUAL_FUEL_PRICES,
  MANUAL_FUEL_PRICE_UNITS,
  MANUAL_FUEL_PRICES_UPDATED_AT,
} from "./fuelMock";

export class FuelPriceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FuelPriceNotFoundError";
  }
}

export interface FuelPriceProvider {
  getPrice(request: FuelPriceRequest): Promise<FuelPrice>;
}

/**
 * Manuel config'ten (`fuelMock.ts`) fiyat okuyan sağlayıcı.
 *
 * Şu an tek sağlayıcı budur. `source: "manual-config"` döner — bu servisi
 * kullanan hiçbir kod, fiyatın gerçek/tahmini olduğunu asla tahmin etmek
 * zorunda kalmaz, doğrudan `source` alanından okur.
 */
export class ConfigFuelPriceProvider implements FuelPriceProvider {
  async getPrice(request: FuelPriceRequest): Promise<FuelPrice> {
    const pricePerUnit = MANUAL_FUEL_PRICES[request.fuelType];
    const unit = MANUAL_FUEL_PRICE_UNITS[request.fuelType];

    if (pricePerUnit === undefined || unit === undefined) {
      throw new FuelPriceNotFoundError(
        `"${request.fuelType}" için manuel config'te fiyat bulunamadı.`
      );
    }

    return {
      fuelType: request.fuelType,
      pricePerUnit,
      unit,
      city: request.city,
      updatedAt: MANUAL_FUEL_PRICES_UPDATED_AT,
      source: "manual-config",
    };
  }
}

// ---------------------------------------------------------------------------
// TODO (gelecek sprint): Gerçek API bağlandığında burada aynı arayüzü
// uygulayan bir `LiveFuelPriceProvider` eklenecek:
//
// export class LiveFuelPriceProvider implements FuelPriceProvider {
//   async getPrice(request: FuelPriceRequest): Promise<FuelPrice> {
//     // fetch(...) ile gerçek fiyat API'sine istek at, source: "live-api"
//     // dönecek şekilde dönüştür.
//   }
// }
// ---------------------------------------------------------------------------
