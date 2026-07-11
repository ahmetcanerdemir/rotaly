// lib/fuel/fuelTypes.ts
//
// Fuel Price Service için paylaşılan tipler.
//
// `FuelType` burada yeniden tanımlanmaz; `lib/costs.ts`'ten import edilir.
// Böylece yakıt tipi için tek gerçek kaynak (single source of truth)
// korunur ve iki modül arasında tip driftine izin verilmez.

import type { FuelType } from "../costs";

export type { FuelType };

/**
 * Tek bir yakıt fiyatı kaydı.
 *
 * `source` ve `updatedAt` alanları, PRD'nin "tahmini veri / gerçek veri"
 * ayrımını bu servis seviyesinde de somutlaştırır: bir fiyatın manuel
 * config'ten mi yoksa canlı bir API'den mi geldiği her zaman açıkça
 * bilinir.
 */
export interface FuelPrice {
  fuelType: FuelType;
  /** Birim fiyat (TL / L veya TL / kWh). */
  pricePerUnit: number;
  unit: "L" | "kWh";
  /** Fiyatın şehre özel olduğu senaryolar için opsiyonel. */
  city?: string;
  /** ISO 8601 tarih-saat; fiyatın en son ne zaman güncellendiği. */
  updatedAt: string;
  /** Fiyatın kaynağı: manuel config mi, yoksa canlı bir API mi. */
  source: "manual-config" | "live-api";
}

/**
 * Bir yakıt fiyatı sağlayıcısından fiyat istemek için kullanılan istek.
 */
export interface FuelPriceRequest {
  fuelType: FuelType;
  /** İsteğe bağlı: şehre özel fiyat destekleyen sağlayıcılar için. */
  city?: string;
}
