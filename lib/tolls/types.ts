// lib/tolls/types.ts
//
// Toll Engine — segment bazlı HGS/otoyol ücret hesaplama sistemi için
// paylaşılan tipler. Bu, projedeki TEK toll mimarisidir (eski, şehir-çifti
// bazlı ayrı sistem — tollTariffTypes.ts/tollTariffMock.ts/
// tollTariffProvider.ts/tollTariffService.ts — kaldırıldı; tüm çağıranlar
// bu modüle taşındı).

/** KGM araç sınıfı (1: otomobil/SUV, 6: motosiklet; 2-5: ağır vasıta). */
export type VehicleClass = 1 | 2 | 3 | 4 | 5 | 6;

/** Ücretli geçiş tesisinin türü. */
export type TollFacilityType = "motorway" | "bridge" | "tunnel";

/**
 * Bir rakamın kaynak güvenilirliği:
 * - "official": KGM'nin kendi resmi tarifesi veya tesisi işleten resmi
 *   otoyol işletmecisinin (ör. OTOYOL A.Ş.) kendi resmi/canlı kaynağı.
 * - "secondary": yalnızca üçüncü parti bir toplayıcı siteden (ör.
 *   otoyoll.com) alındı; bu siteler kendilerini "KGM tarifesine dayanıyor"
 *   olarak tanıtsa da birincil kaynakla çapraz doğrulanmadı ve kendi
 *   içlerinde tutarsızlık gözlemlendi (bkz. tollData.ts dosya başı notu).
 */
export type TollSourceType = "official" | "secondary";

/**
 * Bir hesaplama sonucunun genel güvenilirlik durumu:
 * - "verified": rotadaki TÜM segmentler "official" kaynaklı; `total`
 *   gerçek, tarih damgalı resmi tarifeyi yansıtıyor.
 * - "estimated": bir rakam hesaplandı ama en az bir segment "secondary"
 *   kaynaklı, ya da gidiş-dönüş için dönüş yönü simetrik varsayımla
 *   hesaplandı. "Doğrulanmış" ifadesi bu durumda ASLA kullanılmaz.
 * - "unavailable": rota desteklenmiyor ya da istenen araç sınıfı için
 *   veri yok. `total` bu durumda `null`'dır (0 TL ile karıştırılmaz).
 */
export type TollResultStatus = "verified" | "estimated" | "unavailable";

export interface TollFacility {
  id: string;
  name: string;
  type: TollFacilityType;
  /** İşletmeci (ör. "KGM", "OTOYOL A.Ş."). */
  operator: string;
  /** Bu tarifenin yürürlüğe girdiği tarih (ISO 8601). */
  effectiveFrom: string;
  /** Doğrulanabilir kaynak (resmi/yarı-resmi URL). */
  sourceUrl: string;
  /** Bu rakamın kaynak güvenilirliği — bkz. TollSourceType. */
  sourceType: TollSourceType;
  /** Bu tesisteki geçerli giriş istasyonu adları. */
  entries: string[];
  /** Bu tesisteki geçerli çıkış istasyonu adları. */
  exits: string[];
  /**
   * Araç sınıfına göre tek yön ücret (TL). BİLEREK `Partial` — yalnızca
   * gerçekten kaynağı olan sınıflar için anahtar bulunur; eksik sınıf için
   * uydurma rakam üretilmez (bkz. tollCalculator.ts "unavailable" kuralı).
   */
  prices: Partial<Record<VehicleClass, number>>;
}

export interface TollSegment {
  facilityId: string;
  /** Raporlama için: hesaplama anındaki tesis adı (facility silinirse bile kalır). */
  facilityName: string;
  facilityType: TollFacilityType;
  entry: string;
  exit: string;
  /** İsteğe bağlı yön bilgisi (ör. "İzmir Yönü"). Belirtilmezse yönsüzdür. */
  direction?: string;
  vehicleClass: VehicleClass;
  /** Bu segment için çözülmüş tek yön ücret (TL). */
  price: number;
  sourceType: TollSourceType;
  sourceUrl: string;
  effectiveFrom: string;
}

export interface TollRouteInput {
  originCity: string;
  destinationCity: string;
  vehicleClass: VehicleClass;
  avoidTolls?: boolean;
  roundTrip?: boolean;
}

export interface TollCalculationResult {
  /** Gidiş yönünde kullanılan, tekilleştirilmiş segmentler. */
  segments: TollSegment[];
  /**
   * `roundTrip` isteniyorsa VE dönüş yönü için ayrı tanım varsa, dönüş
   * yönünde çözülen segmentler. Ayrı tanım yoksa `undefined` (bu durumda
   * dönüş, gidiş ile simetrik varsayılmıştır — bkz. `warnings`).
   */
  returnSegments?: TollSegment[];
  /** Tek yön toplam (TL). */
  oneWayTotal: number;
  /** Gidiş-dönüş toplam (TL). */
  roundTripTotal: number;
  /**
   * `roundTrip` girdisine göre asıl kullanılacak toplam (TL).
   * `status === "unavailable"` ise `null` — 0 TL (ör. avoidTolls) ile
   * "veri bulunamadı" durumu KESİNLİKLE karıştırılmaz.
   */
  total: number | null;
  currency: "TRY";
  status: TollResultStatus;
  /**
   * Hesaplamada kullanılan segmentlerin en güncel `effectiveFrom` tarihi.
   * `status === "unavailable"` ise `null`.
   */
  tariffDate: string | null;
  /** Kullanıcıya gösterilebilecek, durumu açıklayan uyarı/not listesi. */
  warnings: string[];
}

export interface TollCorridorSegmentDefinition {
  facilityId: string;
  entry: string;
  exit: string;
  direction?: string;
}

export interface TollCorridorDefinition {
  originCity: string;
  destinationCity: string;
  /** Gidiş yönünde (originCity → destinationCity) sırasıyla geçilen segmentler. */
  segments: TollCorridorSegmentDefinition[];
  /**
   * Dönüş yönünde (destinationCity → originCity) sırasıyla geçilen
   * segmentler — VERİLMESİ İSTEĞE BAĞLIDIR. Verilmezse `roundTrip`
   * hesaplamalarında gidiş ücretiyle simetrik olduğu varsayılır ve sonuç
   * en fazla "estimated" olabilir (asla "verified" değil), bkz.
   * tollCalculator.ts.
   */
  returnSegments?: TollCorridorSegmentDefinition[];
}
