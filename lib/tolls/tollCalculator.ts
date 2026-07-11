// lib/tolls/tollCalculator.ts
//
// Toll Engine — saf, senkron hesaplama fonksiyonu. Dışarıdan hiçbir şey
// okumaz/yazmaz (varsayılan veri seti dışında), bu yüzden kolayca test
// edilebilir ve bir React `useMemo` içinden de çağrılabilir.
//
// DÜRÜSTLÜK KURALLARI:
// 1) Desteklenmeyen rota veya eksik araç sınıfı verisi için ASLA kısmi ya
//    da mesafe bazlı bir rakam üretilmez: `total: null`, `status:
//    "unavailable"`.
// 2) "verified" durumu YALNIZCA rotadaki TÜM segmentler `sourceType:
//    "official"` ise ve dönüş yönü ayrıca çözülebildiyse (ya da tek yön
//    isteniyorsa) kullanılır. Tek bir "secondary" segment veya simetrik
//    dönüş-yönü varsayımı bile sonucu "estimated"e düşürür.
// 3) `avoidTolls === true` durumu kendi başına KESİN bir iş kuralıdır (0
//    TL) — "estimated" değil, "verified" olarak işaretlenir; bu, "veri
//    yok" (unavailable/null) ile "gerçekten 0 TL" (verified/0) arasındaki
//    farkı korur.
// 4) Gidiş-dönüş toplamı doğrudan ×2 ile hesaplanmaz: dönüş yönü, corridor
//    tanımında ayrı bir `returnSegments` varsa BAĞIMSIZ olarak çözülür.
//    Yoksa simetrik ücret varsayılır ama bu açıkça "estimated" + bir
//    `warnings` girdisiyle işaretlenir; hiçbir zaman sessizce "verified"
//    gösterilmez.

import { TOLL_CORRIDORS, TOLL_FACILITIES } from "./tollData";
import type {
  TollCalculationResult,
  TollCorridorDefinition,
  TollCorridorSegmentDefinition,
  TollFacility,
  TollRouteInput,
  TollSegment,
  VehicleClass,
} from "./types";

const VALID_VEHICLE_CLASSES: readonly VehicleClass[] = [1, 2, 3, 4, 5, 6];

function normalize(value: string): string {
  return value.toLocaleLowerCase("tr-TR").trim();
}

function isValidVehicleClass(value: number): value is VehicleClass {
  return (VALID_VEHICLE_CLASSES as readonly number[]).includes(value);
}

function findCorridor(
  originCity: string,
  destinationCity: string,
  corridors: TollCorridorDefinition[]
): TollCorridorDefinition | undefined {
  const from = normalize(originCity);
  const to = normalize(destinationCity);

  return corridors.find((corridor) => {
    const corridorFrom = normalize(corridor.originCity);
    const corridorTo = normalize(corridor.destinationCity);
    return (
      (corridorFrom === from && corridorTo === to) ||
      (corridorFrom === to && corridorTo === from)
    );
  });
}

function segmentKey(facilityId: string, entry: string, exit: string): string {
  return `${facilityId}::${normalize(entry)}::${normalize(exit)}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function unavailable(warnings: string[]): TollCalculationResult {
  return {
    segments: [],
    oneWayTotal: 0,
    roundTripTotal: 0,
    total: null,
    currency: "TRY",
    status: "unavailable",
    tariffDate: null,
    warnings,
  };
}

interface DirectionResolution {
  segments: TollSegment[];
  total: number;
  allOfficial: boolean;
  unresolved: boolean;
  warnings: string[];
  latestEffectiveFrom: string | null;
}

/** Bir yöndeki (gidiş VEYA dönüş) segment tanımlarını gerçek fiyatlara çözer. */
function resolveDirection(
  defs: TollCorridorSegmentDefinition[],
  vehicleClass: VehicleClass,
  facilityById: Map<string, TollFacility>
): DirectionResolution {
  const seenKeys = new Set<string>();
  const segments: TollSegment[] = [];
  const warnings: string[] = [];
  let unresolved = false;
  let allOfficial = true;
  let latestEffectiveFrom: string | null = null;

  for (const def of defs) {
    const key = segmentKey(def.facilityId, def.entry, def.exit);
    if (seenKeys.has(key)) {
      // Aynı köprü/otoyol kesimi tanımda yanlışlıkla iki kez geçse bile
      // toplam yalnızca bir kez sayılır.
      continue;
    }
    seenKeys.add(key);

    const facility = facilityById.get(def.facilityId);
    if (!facility) {
      unresolved = true;
      warnings.push(`"${def.facilityId}" kimlikli tesis veri setinde bulunamadı.`);
      continue;
    }

    const price = facility.prices[vehicleClass];
    if (price === undefined) {
      unresolved = true;
      warnings.push(
        `${facility.name} için ${vehicleClass}. sınıf ücret verisi bulunamadı.`
      );
      continue;
    }

    segments.push({
      facilityId: def.facilityId,
      facilityName: facility.name,
      facilityType: facility.type,
      entry: def.entry,
      exit: def.exit,
      direction: def.direction,
      vehicleClass,
      price,
      sourceType: facility.sourceType,
      sourceUrl: facility.sourceUrl,
      effectiveFrom: facility.effectiveFrom,
    });

    if (facility.sourceType !== "official") {
      allOfficial = false;
    }
    if (!latestEffectiveFrom || facility.effectiveFrom > latestEffectiveFrom) {
      latestEffectiveFrom = facility.effectiveFrom;
    }
  }

  const total = round2(segments.reduce((sum, segment) => sum + segment.price, 0));

  return { segments, total, allOfficial, unresolved, warnings, latestEffectiveFrom };
}

/**
 * Bir şehir çifti + araç sınıfı için otoyol/köprü ücretini hesaplar.
 *
 * `corridors`/`facilities` parametreleri test edilebilirlik için dışarıdan
 * enjekte edilebilir (varsayılan: gerçek V1 örnek veri seti).
 */
export function calculateToll(
  input: TollRouteInput,
  corridors: TollCorridorDefinition[] = TOLL_CORRIDORS,
  facilities: TollFacility[] = TOLL_FACILITIES
): TollCalculationResult {
  if (input.avoidTolls) {
    // Kesin bir iş kuralı — tahmini değil, bu yüzden "verified".
    return {
      segments: [],
      oneWayTotal: 0,
      roundTripTotal: 0,
      total: 0,
      currency: "TRY",
      status: "verified",
      tariffDate: null,
      warnings: [],
    };
  }

  if (!isValidVehicleClass(input.vehicleClass)) {
    return unavailable([
      `Geçersiz araç sınıfı: ${input.vehicleClass}. 1-6 arası bir değer bekleniyor.`,
    ]);
  }

  const corridor = findCorridor(input.originCity, input.destinationCity, corridors);
  if (!corridor) {
    return unavailable(["Bu rota için doğrulanmış otoyol tarifesi bulunamadı."]);
  }

  const facilityById = new Map(facilities.map((facility) => [facility.id, facility]));
  const forward = resolveDirection(corridor.segments, input.vehicleClass, facilityById);

  if (forward.unresolved) {
    // Kısmi toplam YERİNE net "veri yok" — hiçbir segment eksikken
    // yarım-doğru bir rakam gösterilmez.
    return unavailable(forward.warnings);
  }

  if (!input.roundTrip) {
    return {
      segments: forward.segments,
      oneWayTotal: forward.total,
      roundTripTotal: round2(forward.total * 2),
      total: forward.total,
      currency: "TRY",
      status: forward.allOfficial ? "verified" : "estimated",
      tariffDate: forward.latestEffectiveFrom,
      warnings: forward.warnings,
    };
  }

  // roundTrip === true: dönüş yönünü bağımsız çözmeyi dene.
  if (corridor.returnSegments) {
    const backward = resolveDirection(corridor.returnSegments, input.vehicleClass, facilityById);

    if (backward.unresolved) {
      return unavailable([
        ...forward.warnings,
        ...backward.warnings,
        "Dönüş yönü için ücret çözülemedi.",
      ]);
    }

    const roundTripTotal = round2(forward.total + backward.total);
    const allOfficial = forward.allOfficial && backward.allOfficial;
    const latestEffectiveFrom =
      [forward.latestEffectiveFrom, backward.latestEffectiveFrom]
        .filter((date): date is string => Boolean(date))
        .sort()
        .pop() ?? null;

    return {
      segments: forward.segments,
      returnSegments: backward.segments,
      oneWayTotal: forward.total,
      roundTripTotal,
      total: roundTripTotal,
      currency: "TRY",
      status: allOfficial ? "verified" : "estimated",
      tariffDate: latestEffectiveFrom,
      warnings: [...forward.warnings, ...backward.warnings],
    };
  }

  // Dönüş yönü için ayrı veri yok: simetrik ücret varsayılır ama bu asla
  // "verified" olarak gösterilmez — açık bir uyarıyla "estimated" döner.
  const roundTripTotal = round2(forward.total * 2);
  return {
    segments: forward.segments,
    oneWayTotal: forward.total,
    roundTripTotal,
    total: roundTripTotal,
    currency: "TRY",
    status: "estimated",
    tariffDate: forward.latestEffectiveFrom,
    warnings: [
      ...forward.warnings,
      "Dönüş yönü için ayrı ücret verisi yok; tek yön ücretinin aynısı varsayıldı (simetrik ücret varsayımı).",
    ],
  };
}
