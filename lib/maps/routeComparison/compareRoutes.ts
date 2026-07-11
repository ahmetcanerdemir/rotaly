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
// olmaya devam eder. calculateMockTollCost (calculateTrip'in içinde),
// yalnızca kürasyonlu HGS tablosunda (lib/tolls/) bu şehir çifti için bir
// eşleşme YOKSA kullanılan bir fallback'tir; eşleşme varsa resmi rakam bu
// dosya seviyesinde toll alanının üzerine yazılır.

import { calculateTrip, type TripCalculationResult } from "../../tripCalculator";
import type { FuelType } from "../../costs";
import { getTollTariffService } from "../../tolls/tollTariffService";
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
   * dökümü (bkz. lib/tolls/tollTariffMock.ts). "estimated" ise bu ayrım
   * mevcut olmadığından undefined — UI tek bir "Otoyol" kalemi göstermeye
   * devam eder. Gidiş-dönüş ise her iki alan da 2 ile çarpılmıştır.
   */
  tollBreakdown?: {
    bridgeFee: number;
    highwayFee: number;
  };
  /**
   * tollSource "official" ise bu rakamın güvenilirlik seviyesi (bkz.
   * lib/tolls/tollTariffTypes.ts TollAsset.confidence). "verified":
   * birincil bir kaynakla (ör. OTOYOL A.Ş. canlı hesaplayıcı) bizzat
   * doğrulandı. "aggregator": yalnızca üçüncü parti bir toplayıcı siteden
   * (ör. otoyoll.com) alındı, bu oturumda birincil kaynakla çapraz
   * doğrulanmadı.
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

  // Yalnızca otoyollu senaryoda resmi tarife aranır (otoyolsuz zaten 0 TL).
  if (!route.avoidTolls) {
    const tariff = getTollTariffService().getTariff({
      fromCity: input.fromCity,
      toCity: input.toCity,
    });

    if (tariff) {
      const multiplier = input.roundTrip ? 2 : 1;
      const officialToll = round2(tariff.corridor.carPriceOneWay * multiplier);
      const adjustedTotal = round2(
        trip.totalCost - trip.breakdown.toll + officialToll
      );

      return {
        route,
        trip: {
          ...trip,
          breakdown: { ...trip.breakdown, toll: officialToll },
          totalCost: adjustedTotal,
        },
        tollSource: "official",
        tollBreakdown: {
          bridgeFee: round2(tariff.corridor.bridgeFee * multiplier),
          highwayFee: round2(tariff.corridor.highwayFee * multiplier),
        },
        tollConfidence: tariff.corridor.confidence,
      };
    }
  }

  return { route, trip, tollSource: "estimated" };
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
