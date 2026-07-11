// lib/maps/routeComparison/routeComparisonTypes.ts
//
// "Akıllı Rota Karşılaştırması" özelliği için paylaşılan tipler.
//
// Bilerek lib/maps.ts'teki DistanceRequest/DistanceResult'ı genişletmiyor
// ya da yeniden tanımlamıyor — bu özelliğin ihtiyacı (iki senaryo, rota
// noktaları) yeterince farklı olduğu için bağımsız bir tip kümesi
// tanımlandı (bkz. docs/feature-akilli-rota-karsilastirmasi.md Bölüm 4.1).

export interface RoutePoint {
  /** 0-100 aralığında normalize edilmiş x koordinatı. */
  x: number;
  /** 0-100 aralığında normalize edilmiş y koordinatı. */
  y: number;
}

export interface RouteOption {
  /** true ise bu rota otoyollardan kaçınır. */
  avoidTolls: boolean;
  distanceKm: number;
  durationMinutes: number;
  /**
   * Basit, SVG'de çizilebilir rota noktaları (bkz. Bölüm 5.3 — gerçek bir
   * etkileşimli harita değil, bir yer tutucu görselleştirme).
   * Gerçek Google Routes API entegrasyonu aktif olduğunda, Google'ın
   * encoded polyline'ı decode edilip bu şekle çevrilecek; bu tip
   * değişmeyecek.
   */
  points: RoutePoint[];
  /** Gerçek API'den mi geldi, yoksa mock/placeholder veri mi. */
  isMocked: boolean;
}

export interface RouteComparisonRequest {
  origin: string;
  destination: string;
}

export interface RouteComparisonResult {
  withTolls: RouteOption;
  noTolls: RouteOption;
}
