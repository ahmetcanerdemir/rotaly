// lib/tripCalculator.ts
//
// Rotaly'nin ana hesaplama motoru (orchestrator).
//
// Orkestrasyon katmanı: yakıt maliyetini gerçek hesaplama modülünden
// (`lib/costs.ts`) alır, HGS/otoyol maliyetini Toll Engine V1'den
// (`lib/tolls/`, bkz. tollCalculator.ts) alır, otel/yemek/aktivite için
// mock değerler üretir ve hepsini tek bir `TripCalculationResult` içinde
// birleştirir.
//
// UI'dan tamamen bağımsızdır — hiçbir React/Next.js importu yoktur,
// bu yüzden herhangi bir test dosyasından veya API route'undan
// doğrudan çağrılabilir. `calculateTrip` imzası ve dönüş tipi geriye
// dönük uyumludur: `originCity`/`destinationCity`/`vehicleClass`
// verilmezse toll güvenli şekilde 0'a düşer (uydurma rakam üretilmez).

import {
  calculateFuelCost,
  type FuelCalculationResult,
  type FuelType,
} from "./costs";
import { getVehicleById } from "./vehicles";
import { getTollProvider } from "./tolls/tollProvider";
import type { TollCalculationResult, VehicleClass } from "./tolls/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TransportType = "car" | "plane" | "bus" | "train";

export interface TripCalculationInput {
  /** Tek yön mesafe (km). Yakıt hesaplamasına ve mock HGS hesabına girer. */
  distanceKm: number;
  fuelType: FuelType;
  /**
   * İsteğe bağlı: `lib/vehicles.ts` kataloğundan bir araç kimliği
   * (`Vehicle.id`). Verilirse aracın `fuelType` ve `consumptionPer100Km`
   * değerleri, bu input'taki `fuelType`/`consumptionPer100Km` alanlarının
   * YERİNE kullanılır (araç bilgisi önceliklidir). Verilmezse mevcut
   * `fuelType`/`consumptionPer100Km` mantığı aynen çalışır. Katalogda
   * bulunamayan bir id verilirse `calculateTrip` net bir `Error` fırlatır.
   */
  vehicleId?: string;
  /**
   * Ulaşım türü. "car" dışındaki türlerde yakıt maliyeti (ve tüketimi)
   * sıfırlanır — kendi aracıyla gitmeyen kullanıcı için yakıt gideri
   * anlamsızdır. Verilmezse geriye dönük uyumluluk için "car" varsayılır.
   */
  transportType?: TransportType;
  /** true ise mesafe/HGS otomatik gidiş-dönüş olarak hesaplanır. */
  roundTrip?: boolean;
  /**
   * true ise kullanıcı "Otoyollardan Kaçın" tercihini seçmiştir; bu durumda
   * HGS/otoyol kalemi sıfırlanır.
   */
  avoidTolls?: boolean;
  /**
   * İsteğe bağlı: Toll Engine V1'i (bkz. lib/tolls/) devreye sokmak için
   * origin/destination şehir adları. İKİSİ BİRDEN verilmezse toll güvenli
   * şekilde 0'a düşer (geriye dönük uyumluluk — mesafe bazlı tahmini bir
   * rakam ARTIK ÜRETİLMEZ, bkz. dosya başı notu).
   */
  originCity?: string;
  destinationCity?: string;
  /** Verilmezse Toll Engine çağrılırken 1 (otomobil) varsayılır. */
  vehicleClass?: VehicleClass;
  /** Kişi sayısı (otel/yemek/aktivite mock hesaplarında kullanılır). */
  people: number;
  /** Gün sayısı (otel/yemek/aktivite mock hesaplarında kullanılır). */
  days: number;
  /** İsteğe bağlı override'lar — verilmezse costs.ts varsayılanları kullanılır. */
  consumptionPer100Km?: number;
  pricePerUnit?: number;
}

export interface TripCostBreakdown {
  fuel: FuelCalculationResult;
  /** Şu an mock: people * days * sabit gecelik ücret. */
  hotel: number;
  /** Şu an mock: people * days * sabit günlük ücret. */
  food: number;
  /** Şu an mock: people * days * sabit günlük ücret. */
  activities: number;
  /**
   * HGS/otoyol toplamı (TL). `originCity`/`destinationCity` verilmişse
   * Toll Engine'in `TollCalculationResult.total` değeridir (`null` ise —
   * ör. desteklenmeyen rota — burada 0'a düşürülür); verilmemişse de 0'dır
   * (bkz. `tollDetails`).
   */
  toll: number;
  /**
   * `originCity`/`destinationCity` verilmişse Toll Engine'in tam sonucu
   * (segment dökümü, status, tariffDate, warnings). Bu alanlar
   * verilmemişse `undefined` — geriye dönük uyumluluk için `toll` her
   * zaman sade bir sayı olarak kalmaya devam eder.
   */
  tollDetails?: TollCalculationResult;
}

export interface TripCalculationResult {
  input: TripCalculationInput;
  breakdown: TripCostBreakdown;
  totalCost: number;
  currency: "TRY";
}

// ---------------------------------------------------------------------------
// Mock değerler (hotel / food / activities)
//
// Bu sabitler, mevcut calculator UI'ındaki (app/calculator/page.tsx)
// tahmini bütçe formülleriyle aynı büyüklükte tutuldu, ama bu dosya
// UI'dan bağımsız olduğu için oradan import edilmedi.
//
// NOT: HGS/otoyol artık burada mock bir sabitle hesaplanmıyor — bkz.
// `resolveTollResult` ve lib/tolls/tollCalculator.ts.
// ---------------------------------------------------------------------------

const MOCK_HOTEL_PRICE_PER_PERSON_PER_NIGHT = 1200;
const MOCK_FOOD_PRICE_PER_PERSON_PER_DAY = 700;
const MOCK_ACTIVITY_PRICE_PER_PERSON_PER_DAY = 600;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateMockHotelCost(people: number, days: number): number {
  return round2(people * days * MOCK_HOTEL_PRICE_PER_PERSON_PER_NIGHT);
}

function calculateMockFoodCost(people: number, days: number): number {
  return round2(people * days * MOCK_FOOD_PRICE_PER_PERSON_PER_DAY);
}

function calculateMockActivitiesCost(people: number, days: number): number {
  return round2(people * days * MOCK_ACTIVITY_PRICE_PER_PERSON_PER_DAY);
}

/**
 * `originCity`/`destinationCity` İKİSİ BİRDEN verilmişse Toll Engine V1'i
 * çağırır. Verilmemişse (geriye dönük uyumluluk) `undefined` döner — bu
 * durumda çağıran taraf toll'u 0 olarak kabul eder, mesafe bazlı bir
 * tahmin ARTIK ÜRETİLMEZ.
 */
function resolveTollResult(
  input: TripCalculationInput
): TollCalculationResult | undefined {
  if (!input.originCity || !input.destinationCity) {
    return undefined;
  }

  return getTollProvider().calculate({
    originCity: input.originCity,
    destinationCity: input.destinationCity,
    vehicleClass: input.vehicleClass ?? 1,
    avoidTolls: input.avoidTolls,
    roundTrip: input.roundTrip,
  });
}

// ---------------------------------------------------------------------------
// Validasyon
// ---------------------------------------------------------------------------

function assertPositiveInteger(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} sıfırdan büyük bir sayı olmalıdır.`);
  }
}

// ---------------------------------------------------------------------------
// Araç kataloğu entegrasyonu
// ---------------------------------------------------------------------------

interface ResolvedFuelParams {
  fuelType: FuelType;
  consumptionPer100Km?: number;
}

/**
 * `vehicleId` verilmişse `lib/vehicles.ts` kataloğundan aracı bulup
 * fuelType/consumptionPer100Km değerlerini oradan döner. Araç
 * bulunamazsa net bir `Error` fırlatır. `vehicleId` verilmemişse
 * input'taki mevcut fuelType/consumptionPer100Km aynen kullanılır
 * (geriye dönük uyumluluk).
 */
function resolveFuelParams(input: TripCalculationInput): ResolvedFuelParams {
  if (!input.vehicleId) {
    return {
      fuelType: input.fuelType,
      consumptionPer100Km: input.consumptionPer100Km,
    };
  }

  const vehicle = getVehicleById(input.vehicleId);

  if (!vehicle) {
    throw new Error(
      `"${input.vehicleId}" kimlikli araç bulunamadı. lib/vehicles.ts kataloğunda kayıtlı bir vehicleId kullanın.`
    );
  }

  return {
    fuelType: vehicle.fuelType,
    consumptionPer100Km: vehicle.consumptionPer100Km,
  };
}

// ---------------------------------------------------------------------------
// Ana orchestrator fonksiyonu
// ---------------------------------------------------------------------------

/**
 * Bir seyahatin toplam tahmini maliyetini hesaplar.
 *
 * Şu an için:
 * - Yakıt maliyeti `calculateFuelCost` ile gerçek hesaplanır.
 * - HGS/otoyol maliyeti Toll Engine V1 ile hesaplanır (origin/destination
 *   verilmişse); verilmemişse 0'dır.
 * - Otel / yemek / aktivite mock değerlerle hesaplanır.
 *
 * Saf bir fonksiyondur (dışarıdan hiçbir şey okumaz/yazmaz), bu yüzden
 * kolayca unit test edilebilir. UI, sadece bu fonksiyonu çağırıp
 * `TripCalculationResult`'ı ekrana yansıtacak; hesaplama mantığı burada.
 */
export function calculateTrip(
  input: TripCalculationInput
): TripCalculationResult {
  assertPositiveInteger(input.people, "people");
  assertPositiveInteger(input.days, "days");

  const transportType: TransportType = input.transportType ?? "car";
  const { fuelType, consumptionPer100Km } = resolveFuelParams(input);

  const fuelResult = calculateFuelCost({
    distanceKm: input.distanceKm,
    fuelType,
    roundTrip: input.roundTrip,
    consumptionPer100Km,
    pricePerUnit: input.pricePerUnit,
  });

  // Kendi aracıyla gidilmiyorsa (uçak/otobüs/tren) yakıt maliyeti/tüketimi
  // yok sayılır. `calculateFuelCost` yine de çağrılır (mimari korunur),
  // sadece sonuç burada sıfırlanır.
  const fuel: FuelCalculationResult =
    transportType === "car"
      ? fuelResult
      : { ...fuelResult, totalCost: 0, totalUnitsConsumed: 0 };

  const hotel = calculateMockHotelCost(input.people, input.days);
  const food = calculateMockFoodCost(input.people, input.days);
  const activities = calculateMockActivitiesCost(input.people, input.days);

  const tollResult = resolveTollResult(input);
  const rawToll = tollResult?.total ?? 0;

  // Kendi aracıyla gidilmiyorsa (uçak/otobüs/tren) HGS gideri de
  // anlamsızdır — fuel ile birebir simetrik davranış (toll da fuel gibi
  // yalnızca "car" için hesaba katılır).
  const toll = transportType === "car" ? rawToll : 0;

  const breakdown: TripCostBreakdown = {
    fuel,
    hotel,
    food,
    activities,
    toll,
    tollDetails: tollResult,
  };

  const totalCost = round2(
    fuel.totalCost + hotel + food + activities + toll
  );

  return {
    input,
    breakdown,
    totalCost,
    currency: "TRY",
  };
}
