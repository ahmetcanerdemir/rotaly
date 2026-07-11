// lib/maps.ts
//
// Google Maps entegrasyonu için servis katmanı.
//
// `GoogleMapsProvider` artık gerçek Google Distance Matrix API'sine
// bağlanır (bkz. Sprint 15). `MockMapsProvider` test/geliştirme amacıyla
// aynen korunuyor — `getMapsService()`/`setMapsServiceForTesting()`
// factory'si sayesinde ikisi arasında geçiş, bu dosyanın dışında hiçbir
// değişiklik gerektirmez.
//
// ÖNEMLİ: Bu dosya yalnızca SUNUCU tarafında (`app/api/distance/route.ts`
// gibi bir Route Handler içinden) çağrılmalıdır. `GOOGLE_MAPS_API_KEY`
// `NEXT_PUBLIC_` önekine sahip olmadığı için (bilinçli bir güvenlik
// tercihi — anahtar tarayıcıya asla sızmamalı), bu modül bir client
// component'ten ("use client") doğrudan import edilip çağrılırsa
// `process.env.GOOGLE_MAPS_API_KEY` tarayıcıda her zaman `undefined` olur
// ve `getMapsConfig()` gerçek bir anahtar girilmiş olsa bile sürekli
// `MapsConfigError` fırlatır.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DistanceUnit = "metric" | "imperial";

export interface DistanceRequest {
  /** Şehir adı ("Ankara") ya da "lat,lng" formatında koordinat. */
  origin: string;
  destination: string;
  unit?: DistanceUnit;
  /** true ise Google'dan otoyollardan kaçınan bir rota istenir. */
  avoidTolls?: boolean;
}

export interface DistanceResult {
  origin: string;
  destination: string;
  distanceMeters: number;
  distanceText: string; // örn. "450 km"
  durationSeconds: number;
  durationText: string; // örn. "5 saat 10 dk"
  /** Gerçek API'den mi geldi, yoksa mock/placeholder veri mi. */
  isMocked: boolean;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class MapsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapsConfigError";
  }
}

export class MapsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "MapsApiError";
  }
}

export class MapsNotImplementedError extends Error {
  constructor(message = "Google Maps entegrasyonu henüz bağlanmadı.") {
    super(message);
    this.name = "MapsNotImplementedError";
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface MapsConfig {
  apiKey: string;
  baseUrl: string;
}

/**
 * Ortam değişkenlerinden Google Maps yapılandırmasını okur.
 *
 * Bilerek "lazy" çalışır (sadece ihtiyaç duyulduğunda çağrılır) ki
 * API anahtarı henüz girilmemişken bile proje build alabilsin ve
 * şehir seçimi gibi anahtarla ilgisi olmayan akışlar bozulmasın.
 */
export function getMapsConfig(): MapsConfig {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new MapsConfigError(
      "GOOGLE_MAPS_API_KEY tanımlı değil. Lütfen .env.local dosyasına ekleyin."
    );
  }

  return {
    apiKey,
    baseUrl: "https://maps.googleapis.com/maps/api",
  };
}

// ---------------------------------------------------------------------------
// Provider interface — sağlayıcıyı değiştirilebilir (test/mock/gerçek) yapar
// ---------------------------------------------------------------------------

export interface MapsProvider {
  getDistance(request: DistanceRequest): Promise<DistanceResult>;
}

// ---------------------------------------------------------------------------
// Google implementation — gerçek Distance Matrix çağrısı
// ---------------------------------------------------------------------------

export class GoogleMapsProvider implements MapsProvider {
  async getDistance(request: DistanceRequest): Promise<DistanceResult> {
    const config = getMapsConfig();
    const url = buildDistanceMatrixUrl(request, config);

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new MapsApiError(
        `Google Maps API'sine ulaşılamadı: ${
          error instanceof Error ? error.message : "bilinmeyen ağ hatası"
        }`
      );
    }

    if (!response.ok) {
      throw new MapsApiError(
        `Google Maps API hatası: ${response.status}`,
        response.status
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new MapsApiError("Google Maps API yanıtı okunamadı (geçersiz JSON).");
    }

    return parseDistanceMatrixResponse(data, request);
  }
}

// ---------------------------------------------------------------------------
// URL builder — ileride kullanılacak, şimdiden hazır ve test edilebilir
// ---------------------------------------------------------------------------

export function buildDistanceMatrixUrl(
  request: DistanceRequest,
  config: MapsConfig
): string {
  const params = new URLSearchParams({
    origins: request.origin,
    destinations: request.destination,
    units: request.unit ?? "metric",
    mode: "driving",
    language: "tr",
    key: config.apiKey,
  });

  if (request.avoidTolls) {
    params.set("avoid", "tolls");
  }

  return `${config.baseUrl}/distancematrix/json?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Response parser — Google'ın gerçek JSON şekli netleşince doldurulacak
// ---------------------------------------------------------------------------

interface DistanceMatrixElement {
  status: string;
  distance?: { value: number; text: string };
  duration?: { value: number; text: string };
}

interface DistanceMatrixRow {
  elements: DistanceMatrixElement[];
}

interface DistanceMatrixResponseShape {
  status: string;
  rows: DistanceMatrixRow[];
  error_message?: string;
}

function isDistanceMatrixResponse(
  data: unknown
): data is DistanceMatrixResponseShape {
  return (
    typeof data === "object" &&
    data !== null &&
    "status" in data &&
    "rows" in data
  );
}

export function parseDistanceMatrixResponse(
  data: unknown,
  request: DistanceRequest
): DistanceResult {
  if (!isDistanceMatrixResponse(data)) {
    throw new MapsApiError("Google Maps API yanıtı beklenen şekilde değil.");
  }

  if (data.status !== "OK") {
    throw new MapsApiError(
      `Google Maps API hatası: ${data.status}${
        data.error_message ? ` (${data.error_message})` : ""
      }`
    );
  }

  const element = data.rows[0]?.elements[0];

  if (!element) {
    throw new MapsApiError("Google Maps API yanıtında sonuç bulunamadı.");
  }

  if (element.status !== "OK" || !element.distance || !element.duration) {
    throw new MapsApiError(
      `Rota bulunamadı: ${element.status} (${request.origin} → ${request.destination})`
    );
  }

  return {
    origin: request.origin,
    destination: request.destination,
    distanceMeters: element.distance.value,
    distanceText: element.distance.text,
    durationSeconds: element.duration.value,
    durationText: element.duration.text,
    isMocked: false,
  };
}

// ---------------------------------------------------------------------------
// Mock provider — test/geliştirme amacıyla korunur
// ---------------------------------------------------------------------------
//
// `app/api/distance/route.ts`, `GOOGLE_MAPS_API_KEY` tanımlı değilken ve
// yalnızca development ortamındayken bu sınıfı kullanır (bkz. o dosyadaki
// fallback mantığı). Gerçekçi bir demo/geliştirme deneyimi için 0 yerine,
// şehir çiftine göre deterministik (her zaman aynı iki şehir için aynı
// sonucu veren) bir mesafe üretir ve gerçek bir ağ çağrısını simüle etmek
// için kısa bir gecikme ekler.

function estimateMockDistanceKm(origin: string, destination: string): number {
  const seed = `${origin}-${destination}`
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  // 80 km – 900 km aralığında, aynı şehir çifti için hep aynı değeri
  // üreten basit bir mock formül.
  return 80 + (seed % 820);
}

function formatMockDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes} dk`;
  }

  return `${hours} saat ${minutes} dk`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockMapsProvider implements MapsProvider {
  async getDistance(request: DistanceRequest): Promise<DistanceResult> {
    // Gerçek bir API çağrısının gecikmesini simüle eder; loading durumunun
    // UI'da gözlemlenebilmesi için bilerek eklendi.
    await wait(500);

    const distanceKm = estimateMockDistanceKm(request.origin, request.destination);
    const distanceMeters = distanceKm * 1000;
    const averageSpeedKmh = 80;
    const durationSeconds = Math.round((distanceKm / averageSpeedKmh) * 3600);

    return {
      origin: request.origin,
      destination: request.destination,
      distanceMeters,
      distanceText: `${distanceKm} km`,
      durationSeconds,
      durationText: formatMockDuration(durationSeconds),
      isMocked: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Factory — uygulamanın geri kalanı sadece bunu kullanır
// ---------------------------------------------------------------------------

let cachedProvider: MapsProvider | null = null;

/**
 * Uygulamanın kullanacağı tek Maps servis örneğini döndürür (`GoogleMapsProvider`).
 *
 * Yalnızca sunucu tarafında çağrılmalıdır (bkz. dosya başı not) —
 * `app/api/distance/route.ts` içinden kullanılır.
 */
export function getMapsService(): MapsProvider {
  if (!cachedProvider) {
    cachedProvider = new GoogleMapsProvider();
  }
  return cachedProvider;
}

/**
 * Testlerde veya API anahtarı olmadan geliştirirken gerçek provider
 * yerine mock enjekte etmek için.
 */
export function setMapsServiceForTesting(provider: MapsProvider): void {
  cachedProvider = provider;
}
