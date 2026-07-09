// lib/costs.ts
//
// Yakıt maliyeti hesaplama motoru.
//
// Bağımsız, saf (side-effect'siz) bir modül: UI'dan habersizdir, herhangi
// bir yerden (calculator sayfası, API route, test dosyası) çağrılabilir.
// Şu an mock/varsayılan fiyat ve tüketim değerleri kullanır; ileride bu
// değerler gerçek bir kaynaktan (API, config) beslenebilir.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FuelType = "gasoline" | "diesel" | "electric" | "hybrid";

export interface FuelCalculationInput {
  /** Tek yön mesafe (km). */
  distanceKm: number;
  fuelType: FuelType;
  /** true ise mesafe otomatik olarak 2 ile çarpılır (gidiş-dönüş). */
  roundTrip?: boolean;
  /**
   * 100 km başına tüketim (benzin/dizel/hybrid için litre,
   * elektrik için kWh). Verilmezse fuelType'a göre varsayılan kullanılır.
   */
  consumptionPer100Km?: number;
  /**
   * Birim fiyat (litre veya kWh başına, TL). Verilmezse fuelType'a göre
   * varsayılan mock fiyat kullanılır.
   */
  pricePerUnit?: number;
}

export interface FuelCalculationResult {
  fuelType: FuelType;
  /** Hesaplamada kullanılan (roundTrip uygulanmış) toplam mesafe (km). */
  totalDistanceKm: number;
  /** Kullanılan tüketim değeri (L veya kWh / 100km). */
  consumptionPer100Km: number;
  /** Kullanılan birim fiyat (TL / L veya TL / kWh). */
  unitPrice: number;
  /** Tüketim birimi: benzin/dizel/hybrid için "L", elektrik için "kWh". */
  unit: "L" | "kWh";
  /** Toplam tüketilen miktar (L veya kWh). */
  totalUnitsConsumed: number;
  /** Toplam yakıt maliyeti. */
  totalCost: number;
  currency: "TRY";
}

// ---------------------------------------------------------------------------
// Mock varsayılan değerler
// ---------------------------------------------------------------------------

/** 100 km başına varsayılan tüketim (L veya kWh). */
export const DEFAULT_FUEL_CONSUMPTION: Record<FuelType, number> = {
  gasoline: 7.5,
  diesel: 6,
  electric: 18,
  hybrid: 4.5,
};

/** Varsayılan mock birim fiyatlar (TL / L veya TL / kWh). */
export const DEFAULT_FUEL_PRICES: Record<FuelType, number> = {
  gasoline: 45,
  diesel: 42,
  electric: 3.5,
  hybrid: 45,
};

const FUEL_UNITS: Record<FuelType, "L" | "kWh"> = {
  gasoline: "L",
  diesel: "L",
  electric: "kWh",
  hybrid: "L",
};

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

export function getDefaultConsumption(fuelType: FuelType): number {
  return DEFAULT_FUEL_CONSUMPTION[fuelType];
}

export function getDefaultUnitPrice(fuelType: FuelType): number {
  return DEFAULT_FUEL_PRICES[fuelType];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// Ana hesaplama fonksiyonu
// ---------------------------------------------------------------------------

/**
 * Verilen mesafe ve yakıt tipine göre tahmini yakıt maliyetini hesaplar.
 *
 * Saf bir fonksiyondur: dışarıdan hiçbir şey okumaz/yazmaz, aynı input
 * her zaman aynı output'u üretir. Bu sayede kolayca unit test edilebilir.
 */
export function calculateFuelCost(
  input: FuelCalculationInput
): FuelCalculationResult {
  if (!Number.isFinite(input.distanceKm) || input.distanceKm < 0) {
    throw new Error("distanceKm negatif olmayan bir sayı olmalıdır.");
  }

  const consumptionPer100Km =
    input.consumptionPer100Km ?? getDefaultConsumption(input.fuelType);

  if (!Number.isFinite(consumptionPer100Km) || consumptionPer100Km < 0) {
    throw new Error("consumptionPer100Km negatif olmayan bir sayı olmalıdır.");
  }

  const unitPrice = input.pricePerUnit ?? getDefaultUnitPrice(input.fuelType);

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error("pricePerUnit negatif olmayan bir sayı olmalıdır.");
  }

  const totalDistanceKm = input.roundTrip
    ? input.distanceKm * 2
    : input.distanceKm;

  const totalUnitsConsumed = (totalDistanceKm / 100) * consumptionPer100Km;
  const totalCost = totalUnitsConsumed * unitPrice;

  return {
    fuelType: input.fuelType,
    totalDistanceKm,
    consumptionPer100Km,
    unitPrice,
    unit: FUEL_UNITS[input.fuelType],
    totalUnitsConsumed: round2(totalUnitsConsumed),
    totalCost: round2(totalCost),
    currency: "TRY",
  };
}
