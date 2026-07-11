// lib/maps/routeComparison/compareRoutes.ts
//
// "Akıllı Rota Karşılaştırması" maliyet birleştirici (orchestrator).
//
// ÖNEMLİ MİMARİ NOT: Bu dosya, ham rota geometrisini (mesafe/süre) GETİRMEZ
// — bunu app/api/route-comparison/route.ts (sunucu tarafı) yapar, çünkü
// GOOGLE_MAPS_API_KEY istemcide okunamaz. Bu dosya yalnızca ZATEN alınmış
// bir RouteComparisonResult'ı, güncel people/days/roundTrip/vehicleId
// değerleriyle birleştirip maliyet hesaplar. Bu ayrım sayesinde, kullanıcı
// kişi/gün sayısını değiştirdiğinde YENİDEN bir Google Maps çağrısı
// yapılmasına gerek kalmaz — yalnızca bu saf fonksiyon yeniden çalışır
// (React'ta bir useMemo içinden doğrudan çağrılabilir).
//
// calculateTrip, calculateFuelCost — hiçbiri değişmez ve tek çağrı noktası
// olmaya devam eder. Bu dosya `calculateTrip`'i originCity/destinationCity
// VERMEDEN çağırır (yalnızca kendi fromCity/toCity input'uyla Toll Engine'i
// AYRICA sorgular), bu yüzden `calculateTrip`'in kendi içindeki toll
// entegrasyonu burada devreye girmez — `calculateTrip` toll'u güvenli
// şekilde 0 döner. Toll Engine bir rakam çözerse (status "verified" veya
// "estimated") bu dosya seviyesinde toll alanının üzerine yazılır;
// çözemezse (status "unavailable") `tollSource: "estimated"` ile 0 TL
// döner (mesafe bazlı bir tahmin ÜRETİLMEZ).

import { calculateTrip, type TripCalculationResult } from "../../tripCalculator";
import type { FuelType } from "../../costs";
import { getTollProvider } from "../../tolls/tollProvider";
import type { RouteComparisonResult, RouteOption } from "./routeComparisonTypes";

export interface RouteCostInput {
  /** Tarife eşleşmesi şehir adı bazında aranır — rota geometrisinden bağımsız. */
  fromCity: string;
  toCity: string;
  people: number;
  days: number;
  roundTrip?: boolean;
  vehicleId?: string;
  fuelType: FuelType;
}

export interface RouteOptionWithCost {
  route: RouteOption;
  trip: TripCalculationResult;
  /** HGS kaleminin kürasyonlu resmi tablodan mı yoksa tahmini formülden mi geldiği. */
  tollSource: "official" | "estimated";
  /**
   * tollSource "official" ise köprü ücretinin otoyol ücretinden ayrı
   * dökümü (Toll Engine segmentlerinden `facilityType` bazında türetilir —
   * bkz. lib/tolls/tollData.ts). "estimated" ise bu ayrım mevcut
   * olmadığından undefined — UI tek bir "Otoyol" kalemi göstermeye devam
   * eder. Gidiş-dönüş ise Toll Engine'in kendi round-trip toplamına göre
   * ölçeklenmiştir.
   */
  tollBreakdown?: {
    bridgeFee: number;
    highwayFee: number;
  };
  /**
   * tollSource "official" ise bu rakamın güvenilirlik seviyesi. "verified":
   * Toll Engine sonucundaki TÜM segmentler resmi kaynaklı (bkz.
   * lib/tolls/types.ts TollResultStatus). "aggregator": en az bir segment
   * yalnızca üçüncü parti bir kaynaktan (ör. otoyoll.com) geldi ve/veya
   * gidiş-dönüş simetrik varsayımla hesaplandı — bu oturumda birincil
   * kaynakla çapraz doğrulanmadı.
   */
  tollConfidence?: "verified" | "aggregator";
}

export interface RouteComparisonWithCosts {
  withTolls: RouteOptionWithCost;
  noTolls: RouteOptionWithCost;
  difference: {
    /** Pozitifse otoyollu rota daha pahalıdır (otoyolsuza geçmek tasarruf sağlar). */
    costDelta: number;
    /** Pozitifse otoyolsuz rota daha uzun sürer. */
    durationDeltaMinutes: number;
  };
  comment: string;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildOptionCost(
  route: RouteOption,
  input: RouteCostInput
): RouteOptionWithCost {
  const trip = calculateTrip({
    distanceKm: route.distanceKm,
    fuelType: input.fuelType,
    vehicleId: input.vehicleId,
    roundTrip: input.roundTrip,
    people: input.people,
    days: input.days,
    avoidTolls: route.avoidTolls,
  });

  // Yalnızca otoyollu senaryoda Toll Engine sorgulanır (otoyolsuz zaten 0 TL).
  if (route.avoidTolls) {
    return { route, trip, tollSource: "estimated" };
  }

  const result = getTollProvider().calculate({
    originCity: input.fromCity,
    destinationCity: input.toCity,
    // Rotaly şu an yalnızca otomobil (KGM 1. sınıf) hesaplıyor; UI'da bir
    // araç sınıfı seçici yok, bu yüzden burada da yeni bir seçenek eklenmedi.
    vehicleClass: 1,
    roundTrip: input.roundTrip,
  });

  if (result.total === null) {
    // status "unavailable": rota desteklenmiyor veya araç sınıfı verisi
    // yok. Mesafe bazlı bir tahmin ÜRETİLMEZ — toll, calculateTrip'in
    // güvenli 0 fallback'inde kalır.
    return { route, trip, tollSource: "estimated" };
  }

  const adjustedTotal = round2(
    trip.totalCost - trip.breakdown.toll + result.total
  );

  // Köprü/otoyol ayrımı: segmentler her zaman GİDİŞ yönünün tek yön
  // fiyatlarını taşır (bkz. lib/tolls/types.ts TollCalculationResult),
  // `result.total` ise round-trip'te bunun katı/toplamı olabilir. Oranı
  // tek yön toplamından türetip `result.total`'a ölçekliyoruz.
  const oneWayBridge = round2(
    result.segments
      .filter((segment) => segment.facilityType === "bridge")
      .reduce((sum, segment) => sum + segment.price, 0)
  );
  const oneWayHighway = round2(result.oneWayTotal - oneWayBridge);
  const scale = result.oneWayTotal > 0 ? result.total / result.oneWayTotal : 1;

  return {
    route,
    trip: {
      ...trip,
      breakdown: { ...trip.breakdown, toll: result.total },
      totalCost: adjustedTotal,
    },
    tollSource: "official",
    tollBreakdown: {
      bridgeFee: round2(oneWayBridge * scale),
      highwayFee: round2(oneWayHighway * scale),
    },
    tollConfidence: result.status === "verified" ? "verified" : "aggregator",
  };
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours <= 0) {
    return `yaklaşık ${minutes} dk`;
  }

  return minutes > 0
    ? `yaklaşık ${hours} saat ${minutes} dk`
    : `yaklaşık ${hours} saat`;
}

function buildComment(costDelta: number, durationDeltaMinutes: number): string {
  const absCost = Math.round(Math.abs(costDelta)).toLocaleString("tr-TR");
  const durationText = formatDuration(Math.abs(durationDeltaMinutes));

  if (costDelta > 0 && durationDeltaMinutes > 0) {
    return `Otoyolları kullanmazsan ${absCost} TL tasarruf edebilirsin. Yolculuğun ${durationText} uzar.`;
  }

  if (costDelta > 0 && durationDeltaMinutes <= 0) {
    return `Otoyolları kullanmazsan ${absCost} TL tasarruf edebilirsin, üstelik yolculuğun da ${durationText} kısalır.`;
  }

  if (costDelta < 0) {
    return `Otoyolları kullanmak, otoyolsuz rotaya göre ${absCost} TL daha pahalıya geliyor ama yolculuğun ${durationText} kısalıyor.`;
  }

  return "İki rota arasında maliyet farkı bulunmuyor.";
}

/**
 * Ham rota karşılaştırma verisini (mesafe/süre, iki senaryo) güncel
 * seyahat parametreleriyle birleştirip her rota için tam maliyet
 * dökümü, fark ve doğal dilde bir yorum üretir.
 *
 * Saf bir fonksiyondur: dışarıdan hiçbir şey okumaz/yazmaz (tarife
 * servisi de bellek-içi, senkron bir tablo), bu yüzden bir React
 * `useMemo`'su içinden doğrudan çağrılabilir.
 */
export function buildRouteComparisonWithCosts(
  raw: RouteComparisonResult,
  input: RouteCostInput
): RouteComparisonWithCosts {
  const withTolls = buildOptionCost(raw.withTolls, input);
  const noTolls = buildOptionCost(raw.noTolls, input);

  const costDelta = round2(withTolls.trip.totalCost - noTolls.trip.totalCost);
  const durationDeltaMinutes =
    raw.noTolls.durationMinutes - raw.withTolls.durationMinutes;

  return {
    withTolls,
    noTolls,
    difference: { costDelta, durationDeltaMinutes },
    comment: buildComment(costDelta, durationDeltaMinutes),
  };
}
