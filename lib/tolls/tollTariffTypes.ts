// lib/tolls/tollTariffTypes.ts
//
// Resmi KGM (Karayolları Genel Müdürlüğü) verisine dayalı HGS tarife
// servisi için paylaşılan tipler.
//
// Bkz. docs/feature-akilli-rota-karsilastirmasi.md Bölüm 3.6: KGM,
// otoyol/köprü ücretlerini tek bir API değil, 19 ayrı resmi PDF belgesi
// olarak yayımlıyor. Bu servis, bu belgelerden elle doğrulanan varlıkları
// (`TollAsset`) ve bunları kullanan güzergahları (`TollCorridor`) kürasyonlu
// bir tablo olarak tutar.

export interface TollAsset {
  id: string;
  name: string;
  /** Otomobil (KGM Sınıf 1) için tek yön geçiş ücreti (TL). */
  carPriceOneWay: number;
  /**
   * Ücretin türü — kullanıcıya gösterirken köprü ücretini otoyol
   * ücretinden ayırabilmek için. "bridge": tekil bir köprü geçiş ücreti
   * (ör. Osmangazi Köprüsü). "highway": bir otoyol kesiminin (köprü hariç)
   * geçiş ücreti.
   */
  kind: "bridge" | "highway";
  /**
   * Bu rakamın güvenilirlik seviyesi:
   * - "verified": bu oturumda, aracın işlettiği kurumun (ör. OTOYOL A.Ş.)
   *   KENDİ resmi/canlı hesaplayıcısı gibi birincil bir kaynakla bizzat
   *   çapraz doğrulandı.
   * - "aggregator": yalnızca üçüncü parti bir toplayıcı siteden (ör.
   *   otoyoll.com) alındı; site kendisi "KGM tarifelerine dayanıyor" dese
   *   de, bu oturumda birincil bir kaynakla çapraz doğrulanmadı. Bu
   *   siteler arasında iç tutarsızlık gözlemlendiğinden (bkz. aşağıdaki
   *   tollTariffMock.ts dosya başı notu), bu seviye "resmi" ile aynı
   *   güven derecesinde SUNULMAMALI.
   */
  confidence: "verified" | "aggregator";
  /** Doğrulanabilir resmi kaynak (KGM PDF adı/URL'i + varsa teyit kaynağı). */
  source: string;
  /** Bu rakamın en son doğrulandığı tarih (ISO 8601). */
  updatedAt: string;
}

export interface TollCorridor {
  fromCity: string;
  toCity: string;
  /** Bu güzergahta geçilen resmi varlıkların id listesi. */
  assetIds: string[];
  /** Kapsam notu (ör. kısmi kapsam uyarısı). */
  notes?: string;
}

export interface TollTariffRequest {
  fromCity: string;
  toCity: string;
}

export interface TollTariffResolvedCorridor {
  fromCity: string;
  toCity: string;
  /** Tek yön toplam otomobil ücreti (TL) — corridor'daki tüm varlıkların toplamı. */
  carPriceOneWay: number;
  /** Tek yön toplam köprü ücreti (TL) — kind: "bridge" olan varlıkların toplamı. Yoksa 0. */
  bridgeFee: number;
  /** Tek yön toplam otoyol ücreti (TL) — kind: "highway" olan varlıkların toplamı. Yoksa 0. */
  highwayFee: number;
  /**
   * Bu corridor'daki EN ZAYIF halkanın güven seviyesi: tüm varlıklar
   * "verified" ise "verified", herhangi biri "aggregator" ise "aggregator".
   */
  confidence: "verified" | "aggregator";
  assets: TollAsset[];
  notes?: string;
}

export interface TollTariffResult {
  corridor: TollTariffResolvedCorridor;
}
