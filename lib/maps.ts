// lib/maps.ts
//
// Google Maps entegrasyonu için servis katmanı.
//
// Bu dosya ileride Google Distance Matrix API'ye bağlanacak temiz bir
// arayüz sağlar. Şu an için GERÇEK AĞ ÇAĞRISI YAPILMAZ: `getDistance()`
// çağrıldığında `MapsNotImplementedError` fırlatılır.
//
// Bağlamak için ileride yapılacaklar:
// 1. `.env.local` dosyasına GOOGLE_MAPS_API_KEY değerini gir.
// 2. `GoogleMapsProvider.getDistance` içindeki yorumlu bloğu aktif et
//    (fetch çağrısı + `parseDistanceMatrixResponse`).
// 3. Geri kalan kod (config okuma, hata tipleri, factory) değişmeden kalır.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DistanceUnit = "metric" | "imperial";

export interface DistanceRequest {
  /** Şehir adı ("Ankara") ya da "lat,lng" formatında koordinat. */
  origin: string;
  destination: string;
  unit?: DistanceUnit;
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
// Google implementation (henüz stub — gerçek çağrı yapmıyor)
// ---------------------------------------------------------------------------

class GoogleMapsProvider implements MapsProvider {
  async getDistance(request: DistanceRequest): Promise<DistanceResult> {
    // `request` gerçek entegrasyon aktif olduğunda buildDistanceMatrixUrl'e
    // geçilecek; stub aşamasında sadece imzayı netleştirmek için duruyor.
    void request;

    // Anahtar eksikse burada erken ve net bir hata alırız; ama yine de
    // ağ çağrısı yapmayız (henüz kasıtlı olarak devre dışı).
    getMapsConfig();

    // TODO: Gerçek entegrasyon aktif edildiğinde burası şu şekilde olacak:
    //
    // const config = getMapsConfig();
    // const url = buildDistanceMatrixUrl(request, config);
    // const response = await fetch(url);
    //
    // if (!response.ok) {
    //   throw new MapsApiError(
    //     `Google Maps API hatası: ${response.status}`,
    //     response.status
    //   );
    // }
    //
    // const data = await response.json();
    // return parseDistanceMatrixResponse(data, request);

    throw new MapsNotImplementedError();
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
    language: "tr",
    key: config.apiKey,
  });

  return `${config.baseUrl}/distancematrix/json?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Response parser — Google'ın gerçek JSON şekli netleşince doldurulacak
// ---------------------------------------------------------------------------

export function parseDistanceMatrixResponse(
  // Gerçek entegrasyonda Google Distance Matrix response tipiyle değişecek.
  data: unknown,
  request: DistanceRequest
): DistanceResult {
  void data;
  void request;

  // TODO: `data.rows[0].elements[0]` içinden distance/duration çıkar.
  throw new MapsNotImplementedError(
    "parseDistanceMatrixResponse henüz implement edilmedi."
  );

  // Beklenen dönüş şekli (referans için):
  // return {
  //   origin: request.origin,
  //   destination: request.destination,
  //   distanceMeters: element.distance.value,
  //   distanceText: element.distance.text,
  //   durationSeconds: element.duration.value,
  //   durationText: element.duration.text,
  //   isMocked: false,
  // };
}

// ---------------------------------------------------------------------------
// Mock provider — gerçek API bağlanana kadar calculator akışını besler
// ---------------------------------------------------------------------------
//
// `app/calculator/page.tsx` şu an bu sınıfı doğrudan kullanıyor (bkz. o
// dosyadaki TODO). Gerçekçi bir demo/geliştirme deneyimi için 0 yerine,
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
 * Uygulamanın kullanacağı tek Maps servis örneğini döndürür.
 *
 * Gerçek API bağlandığında bu fonksiyonun çağrıldığı yerlerde HİÇBİR
 * değişiklik gerekmez; sadece `GoogleMapsProvider` içindeki TODO'lar
 * doldurulur.
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
