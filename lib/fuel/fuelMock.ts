// lib/fuel/fuelMock.ts
//
// Manuel/statik yakıt fiyatı config'i.
//
// Gerçek bir fiyat API'si bağlanana kadar bu sabitler elle güncellenir.
// Değerler bilinçli olarak `lib/costs.ts`'teki `DEFAULT_FUEL_PRICES` ile
// aynı büyüklükte tutuldu.
//
// BİLİNEN, GEÇİCİ ÇAKIŞMA: `lib/costs.ts`'teki `DEFAULT_FUEL_PRICES` bu
// sprintte dokunulmadan kaldığı için, aynı fiyatlar şu an iki ayrı yerde
// (`costs.ts` ve burada) tanımlı duruyor. Bu kasıtlıdır — `lib/fuel/`
// henüz `costs.ts`'e bağlanmadı (bkz. bu servisin dosya başı yorumu ve
// docs/sprint-15-technical-plan.md Bölüm 2.3). İleride `costs.ts`,
// varsayılan fiyatları buradan okuyacak şekilde güncellenip bu çakışma
// ortadan kaldırılacak.

import type { FuelType } from "../costs";

export const MANUAL_FUEL_PRICES: Record<FuelType, number> = {
  gasoline: 45,
  diesel: 42,
  electric: 3.5,
  hybrid: 45,
};

export const MANUAL_FUEL_PRICE_UNITS: Record<FuelType, "L" | "kWh"> = {
  gasoline: "L",
  diesel: "L",
  electric: "kWh",
  hybrid: "L",
};

/** Bu config'in en son elle güncellendiği tarih (ISO 8601). */
export const MANUAL_FUEL_PRICES_UPDATED_AT = "2026-07-09T00:00:00.000Z";
