// lib/tolls/tollData.ts
//
// ============================================================================
// TEK VERİ KAYNAĞI — ÖRNEK BAŞLANGIÇ VERİ SETİ, GERÇEK RESMİ TARİFE DEĞİL
// ============================================================================
// Bu dosya, projedeki TÜM koridorlar için TEK kaynak gerçektir (eski,
// paralel şehir-çifti sistemi — tollTariffMock.ts vb. — kaldırıldı ve bu
// dosyaya birleştirildi; bkz. compareRoutes.ts artık yalnızca bu modülü
// kullanıyor).
//
// Rakamlar bu proje oturumu sırasında iki kaynaktan derlendi:
//   1) OTOYOL A.Ş.'nin KENDİ resmi canlı ücret hesaplayıcısı
//      (isletme.otoyolas.com.tr/gecis-ucreti-hesapla), Claude in Chrome ile
//      bizzat kullanılarak → sourceType: "official".
//   2) otoyoll.com adlı üçüncü parti bir toplayıcı site → sourceType:
//      "secondary". ÖNEMLİ TUTARSIZLIK: bu site aynı fiziksel segment için
//      (Osmangazi Köprüsü + Gebze-Bursa kesimi) sayfadan sayfaya ₺995 /
//      ₺795 / ₺1.170 gibi 3 FARKLI rakam gösteriyor. Bu yüzden yalnızca
//      doğrulanmış ₺1.170 ile örtüşen veya Osmangazi Köprüsü'nü hiç
//      içermeyen sayfalardan alınan rakamlar kullanıldı; ₺995/₺795 içeren
//      sayfalar KULLANILMADI.
//
// KGM'nin 19 ayrı resmi tarife PDF'i tek tek taranıp kalıcı bir veri
// tabanına aktarılmadı — bu yüzden bu tablo hâlâ bir V1 örnek başlangıç
// veri setidir:
//   - yalnızca 10 örnek koridoru kapsar,
//   - yalnızca 1. sınıf (otomobil) için rakam içerir (2-6. sınıf: veri
//     yok, bkz. TollFacility.prices notu),
//   - hiçbir koridor için ayrı dönüş yönü (returnSegments) verisi YOK —
//     bu yüzden roundTrip hesaplamaları her zaman en fazla "estimated"
//     olabilir (bkz. tollCalculator.ts),
//   - GERÇEK KGM VERİLERİNİN OTOMATİK/TOPLU İÇE AKTARILMASI TODO'DUR.

import type { TollCorridorDefinition, TollFacility } from "./types";

export const TOLL_FACILITIES: TollFacility[] = [
  // --- sourceType: "official" (OTOYOL A.Ş. resmi canlı hesaplayıcısı) ---
  {
    id: "osmangazi-koprusu",
    name: "Osmangazi Köprüsü",
    type: "bridge",
    operator: "OTOYOL A.Ş.",
    effectiveFrom: "2026-07-10",
    sourceUrl: "https://isletme.otoyolas.com.tr/gecis-ucreti-hesapla/",
    sourceType: "official",
    entries: ["Osmangazi Köprüsü"],
    exits: ["Osmangazi Köprüsü"],
    prices: { 1: 1170 },
  },
  {
    id: "izmir-otoyolu-gebze-bursa",
    name: "İzmir Otoyolu (Gebze-Bursa kesimi, Osmangazi Köprüsü → Bursa Kuzey)",
    type: "motorway",
    operator: "OTOYOL A.Ş.",
    effectiveFrom: "2026-07-10",
    sourceUrl: "https://isletme.otoyolas.com.tr/gecis-ucreti-hesapla/",
    sourceType: "official",
    entries: ["Osmangazi Köprüsü"],
    exits: ["Bursa Kuzey"],
    // Türetildi: doğrulanmış toplam (1.540) - doğrulanmış köprü ücreti (1.170).
    // Her iki rakam da OTOYOL A.Ş.'nin kendi canlı hesaplayıcısından.
    prices: { 1: 370 },
  },
  {
    id: "otoyol-segment-balikesir-kuzey",
    name: "Osmangazi Köprüsü sonrası Balıkesir Kuzey çıkışına kadar otoyol kısmı (köprü hariç)",
    type: "motorway",
    operator: "OTOYOL A.Ş.",
    effectiveFrom: "2026-07-10",
    sourceUrl: "https://isletme.otoyolas.com.tr/gecis-ucreti-hesapla/",
    sourceType: "official",
    entries: ["Osmangazi Köprüsü"],
    exits: ["Balıkesir Kuzey"],
    // Türetildi: doğrulanmış toplam (2.030) - doğrulanmış köprü ücreti (1.170).
    // Not: aynı hesaplayıcıda "Balıkesir Batı" çıkışı için toplam 2.170 TL
    // çıkıyor (bu durumda pay 1.000 TL olurdu); burada düşük olan (Kuzey) esas alındı.
    prices: { 1: 860 },
  },

  // --- sourceType: "secondary" (otoyoll.com, çapraz doğrulanmadı) ---
  {
    id: "anadolu-otoyolu-camlica-akinci",
    name: "Anadolu Otoyolu (Çamlıca → Akıncı)",
    type: "motorway",
    operator: "KGM",
    effectiveFrom: "2026-07-01",
    sourceUrl: "https://otoyoll.com/istanbul-ankara-otoyol-ucreti",
    sourceType: "secondary",
    entries: ["Çamlıca"],
    exits: ["Akıncı"],
    prices: { 1: 338 },
  },
  {
    id: "anadolu-otoyolu-camlica-muallimkoy",
    name: "Anadolu Otoyolu (Çamlıca → Muallimköy)",
    type: "motorway",
    operator: "KGM",
    effectiveFrom: "2026-07-01",
    sourceUrl: "https://otoyoll.com/istanbul-mugla-otoyol-ucreti",
    sourceType: "secondary",
    entries: ["Çamlıca"],
    exits: ["Muallimköy"],
    prices: { 1: 49 },
  },
  {
    id: "izmir-otoyolu-bursa-izmir",
    name: "İzmir Otoyolu (Bursa-İzmir kesimi, Bursa Batı → İzmir)",
    type: "motorway",
    operator: "OTOYOL A.Ş.",
    effectiveFrom: "2026-07-10",
    sourceUrl: "https://otoyoll.com/istanbul-mugla-otoyol-ucreti",
    // NOT: işletmecisi OTOYOL A.Ş. olsa da bu rakamın kendisi yalnızca
    // otoyoll.com'dan alındı (OTOYOL A.Ş.'nin kendi hesaplayıcısıyla bu
    // segment için ayrıca çapraz doğrulanmadı) — bu yüzden "secondary".
    sourceType: "secondary",
    entries: ["Bursa Batı"],
    exits: ["İzmir"],
    prices: { 1: 1355 },
  },
  {
    id: "avrupa-otoyolu-mahmutbey-kinali",
    name: "Avrupa Otoyolu (Mahmutbey → Kınalı)",
    type: "motorway",
    operator: "KGM",
    effectiveFrom: "2026-07-01",
    sourceUrl: "https://otoyoll.com/istanbul-canakkale-otoyol-ucreti",
    sourceType: "secondary",
    entries: ["Mahmutbey"],
    exits: ["Kınalı"],
    prices: { 1: 73 },
  },
  {
    id: "malkara-canakkale-otoyolu",
    name:
      "Malkara-Çanakkale Otoyolu (Malkara → 1915 Çanakkale Köprüsü, köprü ücretiyle birlikte tek kalem)",
    type: "motorway",
    operator: "KGM",
    effectiveFrom: "2026-07-01",
    sourceUrl: "https://otoyoll.com/istanbul-canakkale-otoyol-ucreti",
    sourceType: "secondary",
    entries: ["Malkara"],
    exits: ["1915 Çanakkale Köprüsü"],
    // NOT: 1915 Çanakkale Köprüsü'nün kendi ücreti bu kalemden ayrıştırılamadı.
    prices: { 1: 1260 },
  },
  {
    id: "ankara-nigde-otoyolu",
    name: "Ankara-Niğde Otoyolu (Ankara → Niğde)",
    type: "motorway",
    operator: "KGM",
    effectiveFrom: "2026-07-01",
    sourceUrl: "https://otoyoll.com/ankara-nigde-otoyol-ucreti",
    sourceType: "secondary",
    entries: ["Ankara"],
    exits: ["Niğde"],
    prices: { 1: 925 },
  },
  {
    id: "cukurova-otoyolu-golcuk-nigde-guney",
    name: "Çukurova Otoyolu (Niğde-Mersin-Adana kesimi, Gölcük → Niğde Güney)",
    type: "motorway",
    operator: "KGM",
    effectiveFrom: "2026-07-01",
    sourceUrl: "https://otoyoll.com/ankara-nigde-otoyol-ucreti",
    sourceType: "secondary",
    entries: ["Gölcük"],
    exits: ["Niğde Güney"],
    prices: { 1: 40 },
  },
  {
    id: "aydin-denizli-otoyolu",
    name: "Aydın-Denizli Otoyolu (Aydın Güney → Kumkısık A)",
    type: "motorway",
    operator: "KGM",
    effectiveFrom: "2026-07-01",
    sourceUrl: "https://otoyoll.com/aydin-denizli-otoyol-ucreti",
    sourceType: "secondary",
    entries: ["Aydın Güney"],
    exits: ["Kumkısık A"],
    prices: { 1: 470 },
  },
  {
    id: "izmir-aydin-otoyolu",
    name: "İzmir-Aydın Otoyolu (Işıkkent → Aydın Batı)",
    type: "motorway",
    operator: "KGM",
    effectiveFrom: "2026-07-01",
    sourceUrl: "https://otoyoll.com/izmir-antalya-otoyol-ucreti",
    sourceType: "secondary",
    entries: ["Işıkkent"],
    exits: ["Aydın Batı"],
    prices: { 1: 73 },
  },
  {
    id: "istanbul-antalya-hizli-rota-lump",
    name:
      "İstanbul-Antalya en hızlı/hesaplı rota (Anadolu Otoyolu + YSS Kuzey Çevre Otoyolu + Kuzey Marmara Otoyolu + İzmit OSB, tek kalem toplam)",
    type: "motorway",
    operator: "KGM",
    effectiveFrom: "2026-07-01",
    sourceUrl: "https://otoyoll.com/istanbul-antalya-otoyol-ucreti",
    sourceType: "secondary",
    entries: ["İstanbul"],
    exits: ["Antalya"],
    // NOT: kaynak sayfada 5 ayrı gişe kalemi olarak veriliyor (49+45+310+
    // 19,5+49 = 472,5); burada tek kalem olarak birleştirildi (mevcut
    // sistemden devralınan basitleştirme, yeni bir ayrıştırma eklenmedi).
    prices: { 1: 472.5 },
  },
  {
    id: "izmir-otoyolu-bursa-balikesir",
    name: "İzmir Otoyolu (Bursa-Balıkesir kesimi, Bursa Batı → Balıkesir Kuzey)",
    type: "motorway",
    operator: "OTOYOL A.Ş.",
    effectiveFrom: "2026-07-10",
    sourceUrl: "https://otoyoll.com/bursa-balikesir-otoyol-ucreti",
    sourceType: "secondary",
    entries: ["Bursa Batı"],
    exits: ["Balıkesir Kuzey"],
    prices: { 1: 490 },
  },
];

/**
 * TODO(gerçek KGM verisi): Bu 10 koridor, KGM'nin 19 ayrı resmi tarife
 * PDF'i tek tek taranıp yapılandırılmış hâle getirilene kadar geçerli bir
 * V1 örnek veri setidir. Kapsam genişletilirken her yeni koridor için de
 * aynı disiplinle (gerçek kaynak + tarih + sourceType) eklenmelidir.
 *
 * TODO(dönüş yönü): Hiçbir koridor için `returnSegments` tanımlanmadı —
 * gerçek dönüş yönü tarifesi araştırılıp eklenene kadar tüm roundTrip
 * hesaplamaları simetrik varsayımla "estimated" döner (bkz. tollCalculator.ts).
 */
export const TOLL_CORRIDORS: TollCorridorDefinition[] = [
  {
    originCity: "İstanbul",
    destinationCity: "Bursa",
    segments: [
      { facilityId: "osmangazi-koprusu", entry: "Osmangazi Köprüsü", exit: "Osmangazi Köprüsü" },
      { facilityId: "izmir-otoyolu-gebze-bursa", entry: "Osmangazi Köprüsü", exit: "Bursa Kuzey" },
    ],
  },
  {
    originCity: "İstanbul",
    destinationCity: "Balıkesir",
    segments: [
      { facilityId: "osmangazi-koprusu", entry: "Osmangazi Köprüsü", exit: "Osmangazi Köprüsü" },
      {
        facilityId: "otoyol-segment-balikesir-kuzey",
        entry: "Osmangazi Köprüsü",
        exit: "Balıkesir Kuzey",
      },
    ],
  },
  {
    originCity: "İstanbul",
    destinationCity: "Ankara",
    segments: [
      { facilityId: "anadolu-otoyolu-camlica-akinci", entry: "Çamlıca", exit: "Akıncı" },
    ],
  },
  {
    originCity: "İstanbul",
    destinationCity: "İzmir",
    segments: [
      { facilityId: "anadolu-otoyolu-camlica-muallimkoy", entry: "Çamlıca", exit: "Muallimköy" },
      { facilityId: "osmangazi-koprusu", entry: "Osmangazi Köprüsü", exit: "Osmangazi Köprüsü" },
      { facilityId: "izmir-otoyolu-gebze-bursa", entry: "Osmangazi Köprüsü", exit: "Bursa Kuzey" },
      { facilityId: "izmir-otoyolu-bursa-izmir", entry: "Bursa Batı", exit: "İzmir" },
    ],
  },
  {
    originCity: "İstanbul",
    destinationCity: "Çanakkale",
    segments: [
      { facilityId: "avrupa-otoyolu-mahmutbey-kinali", entry: "Mahmutbey", exit: "Kınalı" },
      {
        facilityId: "malkara-canakkale-otoyolu",
        entry: "Malkara",
        exit: "1915 Çanakkale Köprüsü",
      },
    ],
  },
  {
    originCity: "İstanbul",
    destinationCity: "Antalya",
    segments: [
      { facilityId: "istanbul-antalya-hizli-rota-lump", entry: "İstanbul", exit: "Antalya" },
    ],
  },
  {
    originCity: "Ankara",
    destinationCity: "Niğde",
    segments: [
      { facilityId: "ankara-nigde-otoyolu", entry: "Ankara", exit: "Niğde" },
      {
        facilityId: "cukurova-otoyolu-golcuk-nigde-guney",
        entry: "Gölcük",
        exit: "Niğde Güney",
      },
    ],
  },
  {
    originCity: "Aydın",
    destinationCity: "Denizli",
    segments: [
      { facilityId: "aydin-denizli-otoyolu", entry: "Aydın Güney", exit: "Kumkısık A" },
    ],
  },
  {
    originCity: "Bursa",
    destinationCity: "Balıkesir",
    segments: [
      {
        facilityId: "izmir-otoyolu-bursa-balikesir",
        entry: "Bursa Batı",
        exit: "Balıkesir Kuzey",
      },
    ],
  },
  {
    originCity: "İzmir",
    destinationCity: "Antalya",
    segments: [
      { facilityId: "izmir-aydin-otoyolu", entry: "Işıkkent", exit: "Aydın Batı" },
      { facilityId: "aydin-denizli-otoyolu", entry: "Aydın Güney", exit: "Kumkısık A" },
    ],
  },
];
