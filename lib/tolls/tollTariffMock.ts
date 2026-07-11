// lib/tolls/tollTariffMock.ts
//
// Kürasyonlu, resmi veriye dayalı HGS tarife tablosu.
//
// DÜRÜSTLÜK NOTU (bkz. docs/feature-akilli-rota-karsilastirmasi.md Bölüm 3.6):
// KGM'nin resmi tarife PDF'leri (kgm.gov.tr) çok sütunlu, istasyon-çifti
// bazlı tablolar şeklinde yayımlanıyor ve bunları metne çevrilmiş hâlden
// hatasız ayrıştırmak güvenilir değil. Bu dosyadaki varlıklar iki farklı
// güven seviyesinde toplanıyor (bkz. TollAsset.confidence):
//
// 1) "verified" — OTOYOL A.Ş.'nin kendi resmi/canlı ücret hesaplayıcısı
//    (isletme.otoyolas.com.tr/gecis-ucreti-hesapla) Claude in Chrome ile
//    bizzat kullanılarak doğrulandı.
//
// 2) "aggregator" — otoyoll.com adlı üçüncü parti bir toplayıcı siteden
//    alındı. ÖNEMLİ TUTARSIZLIK TESPİTİ: bu site aynı fiziksel segment için
//    (Osmangazi Köprüsü + Gebze-Bursa otoyol kesimi) farklı sayfalarda 3
//    FARKLI rakam gösteriyor:
//      - istanbul-bursa-otoyol-ucreti / istanbul-izmir-otoyol-ucreti:
//        Osmangazi Köprüsü ₺995 + Gebze-Bursa ₺315 (ESKİ/stale görünüyor)
//      - istanbul-ankara-otoyol-ucreti ("Alternatif" varyant): aynı ESKİ
//        rakamlar (995 + 315)
//      - istanbul-muğla-otoyol-ucreti / istanbul-antalya-otoyol-ucreti
//        ("Konforlu"/"En Kısa" varyant): ₺1.170 + ₺370 — bu da bizim
//        OTOYOL A.Ş.'den bizzat doğruladığımız rakamla BİREBİR eşleşiyor.
//      - /kopruler sayfası: Osmangazi Köprüsü 1. sınıf ₺795 (üçüncü, farklı
//        bir rakam daha).
//    Bu yüzden otoyoll.com'dan yalnızca (a) Osmangazi Köprüsü'nü hiç
//    içermeyen güzergahlar, veya (b) içeriyorsa yalnızca doğrulanmış
//    ₺1.170 rakamıyla eşleşen sayfalar kullanıldı. ₺995/₺795 gösteren
//    sayfalardaki rakamlar KULLANILMADI (bkz. aşağıdaki notlar).
//    "aggregator" seviyesindeki hiçbir rakam bu oturumda birincil bir
//    kaynakla çapraz doğrulanmadı; yalnızca "muhtemelen güncel" olarak
//    değerlendirildi. UI'da bu ayrım korunuyor (bkz.
//    RouteOptionCard/TripResultSummary: "verified" → "(resmi)",
//    "aggregator" → "(KGM tarifesi — 3. parti kaynak)").
//
// DÜZELTME NOTU (1. tur): İlk sürümde İstanbul-Bursa için yalnızca
// Osmangazi Köprüsü'nün TEK BAŞINA geçiş ücreti (1.170 TL) kullanılmıştı.
// Bu YANLIŞTI — Bursa'ya gerçekten ulaşmak için köprüden sonra otoyolda
// devam edip bir çıkış gişesinden çıkmak gerekiyor, bu da ayrı bir otoyol
// kısmı ücreti daha ekliyor. Canlı hesaplayıcıyla doğrulanan gerçek toplam
// (köprü + otoyol) 1.540 TL'dir.
//
// DÜZELTME NOTU (2. tur — köprü/otoyol ayrımı): Köprü ücreti otoyol
// ücretinden ayrı gösterilmek istendi. Köprü payı (1.170 TL) doğrudan
// doğrulanmış tekil bir rakamdır. Otoyol payı ise TÜRETİLMİŞ bir değerdir:
// (doğrulanmış toplam) − (doğrulanmış köprü ücreti).

import type { TollAsset, TollCorridor } from "./tollTariffTypes";

export const TOLL_ASSETS: TollAsset[] = [
  // --- "verified" seviyesi: OTOYOL A.Ş. resmi canlı hesaplayıcısı ---
  {
    id: "osmangazi-koprusu",
    name: "Osmangazi Köprüsü (köprü geçiş ücreti)",
    carPriceOneWay: 1170,
    kind: "bridge",
    confidence: "verified",
    source:
      "isletme.otoyolas.com.tr/gecis-ucreti-hesapla (OTOYOL A.Ş. resmi canlı hesaplayıcı) ile doğrulandı; kgm.gov.tr resmi tarife PDF'i + haber teyidi (takvim.com.tr, 30.06.2026) ile de örtüşüyor.",
    updatedAt: "2026-07-10",
  },
  {
    id: "otoyol-segment-bursa-kuzey",
    name: "Osmangazi Köprüsü sonrası Bursa Kuzey çıkışına kadar otoyol kısmı (köprü hariç)",
    carPriceOneWay: 370,
    kind: "highway",
    confidence: "verified",
    source:
      "TÜRETİLMİŞ: isletme.otoyolas.com.tr/gecis-ucreti-hesapla üzerinde okunan toplam (1.540 TL) − doğrulanmış köprü ücreti (1.170 TL) = 370 TL. otoyoll.com'un istanbul-muğla ve istanbul-antalya sayfalarındaki (Konforlu/En Kısa varyant) ₺370 rakamıyla da örtüşüyor.",
    updatedAt: "2026-07-10",
  },
  {
    id: "otoyol-segment-balikesir-kuzey",
    name: "Osmangazi Köprüsü sonrası Balıkesir Kuzey çıkışına kadar otoyol kısmı (köprü hariç)",
    carPriceOneWay: 860,
    kind: "highway",
    confidence: "verified",
    source:
      "TÜRETİLMİŞ: isletme.otoyolas.com.tr/gecis-ucreti-hesapla üzerinde okunan toplam (2.030 TL) − doğrulanmış köprü ücreti (1.170 TL) = 860 TL. Not: aynı hesaplayıcıda \"Balıkesir Batı\" çıkışı için toplam 2.170 TL çıkıyor (otoyol payı bu durumda 1000 TL olurdu); burada düşük olan (Kuzey) esas alındı.",
    updatedAt: "2026-07-10",
  },

  // --- "aggregator" seviyesi: otoyoll.com (3. parti, çapraz doğrulanmadı) ---
  // Yalnızca Osmangazi Köprüsü'nü hiç içermeyen veya doğrulanmış ₺1.170
  // rakamıyla örtüşen sayfalardan alındı (bkz. dosya başı notu).
  {
    id: "otoyoll-istanbul-ankara-hizli",
    name: "İstanbul-Ankara (en hızlı/hesaplı rota, yalnızca Anadolu Otoyolu — Çamlıca → Akıncı, köprü içermez)",
    carPriceOneWay: 338,
    kind: "highway",
    confidence: "aggregator",
    source:
      "otoyoll.com/istanbul-ankara-otoyol-ucreti (\"Hızlı ve Hesaplı\" varyant). Bu varyant Osmangazi Köprüsü'nü hiç kullanmıyor, bu yüzden sitedeki köprü-rakamı tutarsızlığından etkilenmiyor. Aynı sayfadaki \"Alternatif\" varyant (Osmangazi Köprüsü ₺995 üzerinden) BİLEREK KULLANILMADI çünkü ₺995 rakamı bizim doğruladığımız ₺1.170 ile uyuşmuyor (muhtemelen eski/güncellenmemiş sayfa).",
    updatedAt: "2026-07-10",
  },
  {
    id: "otoyoll-istanbul-antalya-hizli",
    name: "İstanbul-Antalya (en hızlı/hesaplı rota, Kuzey Marmara Otoyolu üzerinden, köprü içermez)",
    carPriceOneWay: 472.5,
    kind: "highway",
    confidence: "aggregator",
    source:
      "otoyoll.com/istanbul-antalya-otoyol-ucreti (\"Hızlı ve Hesaplı\" varyant, 690 km, ~8sa4dk). Bu varyant Osmangazi Köprüsü'nü kullanmıyor. Aynı sayfadaki Bursa üzerinden geçen \"Konforlu\"/\"En Kısa\" varyantlar (₺1.170 köprü dahil, toplam ₺1.589) doğrulanmış rakamla örtüşüyor ama daha uzun/pahalı bir alternatif; birincil rota olarak en hızlı/hesaplı varyant seçildi.",
    updatedAt: "2026-07-10",
  },
  {
    id: "otoyoll-istanbul-canakkale",
    name: "İstanbul-Çanakkale (Avrupa Otoyolu + Malkara-Çanakkale Otoyolu, 1915 Çanakkale Köprüsü dahil ama ayrıştırılamadı)",
    carPriceOneWay: 1333,
    kind: "highway",
    confidence: "aggregator",
    source:
      "otoyoll.com/istanbul-canakkale-otoyol-ucreti. Köprü ücreti bu sayfada otoyol kesimiyle tek kalemde birleşik verildiği için (Malkara → 1915 Çanakkale Köprüsü ₺1.260) köprü/otoyol ayrımı yapılamadı; bu yüzden \"highway\" olarak tek kalem işlendi. Doğrulanmamış (Osmangazi ile ilgili tutarsızlık bu segmenti etkilemiyor ama başka bir birincil kaynakla da çapraz doğrulanmadı).",
    updatedAt: "2026-07-10",
  },
  {
    id: "otoyoll-bursa-balikesir",
    name: "Bursa-Balıkesir (İzmir Otoyolu, Bursa Batı → Balıkesir Kuzey)",
    carPriceOneWay: 490,
    kind: "highway",
    confidence: "aggregator",
    source:
      "otoyoll.com/bursa-balikesir-otoyol-ucreti (\"Konforlu\" varyant). Aynı sayfada \"Hesaplı\" varyant (Karacabey Batı → Balıkesir Kuzey, ₺295) da mevcut; burada standart/konforlu varyant esas alındı. Doğrulanmamış.",
    updatedAt: "2026-07-10",
  },
  {
    id: "otoyoll-izmir-antalya",
    name: "İzmir-Antalya (İzmir-Aydın Otoyolu + Aydın-Denizli Otoyolu)",
    carPriceOneWay: 543,
    kind: "highway",
    confidence: "aggregator",
    source:
      "otoyoll.com/izmir-antalya-otoyol-ucreti (\"Konforlu\" varyant). Aynı sayfada daha ucuz iki alternatif varyant da var (₺165, ₺73) — bunlar muhtemelen rotanın yalnızca bir kısmını kapsıyor; burada tam güzergahı kapsayan \"Konforlu\" varyant esas alındı. Doğrulanmamış.",
    updatedAt: "2026-07-10",
  },
];

export const TOLL_CORRIDORS: TollCorridor[] = [
  {
    fromCity: "İstanbul",
    toCity: "Bursa",
    assetIds: ["osmangazi-koprusu", "otoyol-segment-bursa-kuzey"],
    notes:
      "Osmangazi Köprüsü'nden Bursa Kuzey çıkışına kadar (köprü + otoyol kısmı) toplam ücrettir. Köprü payı doğrudan doğrulanmıştır; otoyol payı toplamdan türetilmiştir.",
  },
  {
    fromCity: "İstanbul",
    toCity: "Balıkesir",
    assetIds: ["osmangazi-koprusu", "otoyol-segment-balikesir-kuzey"],
    notes:
      "Osmangazi Köprüsü'nden Balıkesir Kuzey çıkışına kadar toplam ücrettir. Balıkesir Batı çıkışı seçilirse gerçek toplam 2.170 TL'dir (bu tabloda modellenen tek bir sabit rakam, gerçek çıkışa göre ±140 TL sapabilir).",
  },
  {
    fromCity: "İstanbul",
    toCity: "Ankara",
    assetIds: ["otoyoll-istanbul-ankara-hizli"],
    notes:
      "otoyoll.com kaynağı (3. parti, doğrulanmamış). En hızlı/hesaplı rota (yalnızca Anadolu Otoyolu, köprü yok) esas alındı; Bursa üzerinden geçen daha pahalı bir alternatif de var ama bu tabloda modellenmedi.",
  },
  {
    fromCity: "İstanbul",
    toCity: "Antalya",
    assetIds: ["otoyoll-istanbul-antalya-hizli"],
    notes:
      "otoyoll.com kaynağı (3. parti, doğrulanmamış). En hızlı/hesaplı rota (Kuzey Marmara Otoyolu, köprü yok) esas alındı. Bursa/İzmir üzerinden geçen daha uzun bir alternatif (₺1.589, doğrulanmış köprü rakamıyla örtüşüyor) da var ama bu tabloda modellenmedi.",
  },
  {
    fromCity: "İstanbul",
    toCity: "Çanakkale",
    assetIds: ["otoyoll-istanbul-canakkale"],
    notes: "otoyoll.com kaynağı (3. parti, doğrulanmamış). Köprü/otoyol ayrımı kaynak sayfada mevcut değildi.",
  },
  {
    fromCity: "Bursa",
    toCity: "Balıkesir",
    assetIds: ["otoyoll-bursa-balikesir"],
    notes: "otoyoll.com kaynağı (3. parti, doğrulanmamış).",
  },
  {
    fromCity: "İzmir",
    toCity: "Antalya",
    assetIds: ["otoyoll-izmir-antalya"],
    notes: "otoyoll.com kaynağı (3. parti, doğrulanmamış).",
  },
];
