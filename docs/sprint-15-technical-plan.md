# Sprint 15 — Teknik Plan: Rotaly V1'i Canlıya Hazırlama

**Durum:** Onaylandı — kod yazımına geçiliyor (aşağıdaki Bölüm 7'deki 3 karar netleşti; Bölüm 1.3'te kritik bir mimari düzeltme eklendi)
**Kapsam:** Yalnızca görev tanımındaki 4 madde (Google Maps, Fuel Price Service iskeleti, Otoyol Tercihi, Gidiş-Dönüş). Başka hiçbir şey değişmeyecek.

---

## 0. Mevcut Durum Analizi

Kod tabanı okundu; ilgili gerçek durum:

| Dosya | Durum |
|---|---|
| `lib/maps.ts` | `MapsProvider` arayüzü, `MockMapsProvider` (çalışıyor), `GoogleMapsProvider` (stub — `getDistance` her zaman `MapsNotImplementedError` fırlatıyor), `buildDistanceMatrixUrl`/`parseDistanceMatrixResponse` (hazır ama kullanılmıyor, Distance Matrix (legacy) şekline göre yazılmış), `getMapsService()`/`setMapsServiceForTesting()` factory. |
| `app/calculator/page.tsx` | `mapsProvider = new MockMapsProvider()` **doğrudan** örnekleniyor (factory'yi hiç kullanmıyor). `calculateTrip` çağrısı `roundTrip` ve `transportType` **göndermiyor** — `TripCalculationInput` bu alanları destekliyor ama page.tsx bağlamıyor. |
| `lib/tripCalculator.ts` | `roundTrip?: boolean` zaten var, `calculateFuelCost`'a ve HGS (`calculateMockTollCost`) hesaplamasına doğru şekilde geçiriliyor. `TransportType`, `vehicleId` de destekleniyor ama page.tsx `transportType`'ı geçmiyor (bkz. Açık Karar #3). |
| `lib/costs.ts`, `lib/vehicles.ts` | Bağımsız, saf modüller; bu sprintte hiç dokunulmayacak. |
| `.env.local` | `GOOGLE_MAPS_API_KEY=` **boş**. Gerçek entegrasyonun uçtan uca test edilebilmesi için gerçek bir anahtar girilmesi gerekiyor (bunu kendiniz yapmanız gerekir — kimlik bilgisi girme konusunda size yardımcı olamam). |
| `package.json` | Otomatik test altyapısı (Jest/Vitest) **yok**. "Test amacıyla korunacak" ifadesi bu sprintte, `setMapsServiceForTesting` ile manuel/geliştirme zamanı mock enjeksiyonu anlamına geliyor; otomatik test suite bu sprintin kapsamında değil. |
| `docs/PRD.md` | Fuel Price Service için `lib/pricing/` önermişti; bu sprintin talimatı `lib/fuel/` diyor. **Bilinen fark** — Bölüm 2'de ele alınıyor. |

---

## 1. Google Maps Distance Matrix Entegrasyonu

### 1.1 API seçimi: Distance Matrix (legacy), Routes API değil

`lib/maps.ts` içindeki mevcut `buildDistanceMatrixUrl`/`parseDistanceMatrixResponse` zaten **Distance Matrix API**'ye göre (GET, query-param tabanlı) yazılmış birer taslak. Google'ın daha yeni "Routes API"si (`computeRoutes`) alternatif rota/kriter (Rota Tercihi — PRD V2 Sprint 6) için daha güçlü, ama POST + JSON body + field-mask header gerektiren tamamen farklı bir istek şekli demek — yani mevcut taslakların yeniden yazılması, "sadece bağlantı yap" ilkesinin ötesine geçer.

**Öneri:** Bu sprintte **Distance Matrix API** ile devam edilsin. Sebep: (a) mevcut taslak zaten bu şekle göre yazılmış, (b) bu sprintin gerçek ihtiyacı (tek mesafe/süre + `avoid=tolls`) Distance Matrix ile tam karşılanıyor, (c) Routes API'ye geçiş, PRD'de zaten planlı olan "Rota Tercihi" (V2 Sprint 6) sprintine bırakılırsa gereksiz erken karmaşıklık eklenmemiş olur.

### 1.2 `lib/maps.ts` değişiklikleri

- `DistanceRequest`'e **yeni opsiyonel alan**: `avoidTolls?: boolean`.
- `buildDistanceMatrixUrl`: `request.avoidTolls` true ise `avoid=tolls` query param'ı eklenir. `mode=driving` açıkça eklenir (şu an default'a bırakılmış, netlik için belirtilmeli).
- `GoogleMapsProvider.getDistance`: yorum satırındaki plan aynen uygulanır —
  1. `getMapsConfig()` ile anahtarı oku (zaten var).
  2. `buildDistanceMatrixUrl` ile URL kur, `fetch` ile GET isteği at.
  3. HTTP seviyesinde hata (`!response.ok`) → `MapsApiError`.
  4. Google'ın kendi `status` alanı (`"OK"` değilse, ör. `REQUEST_DENIED`, `OVER_QUERY_LIMIT`) → `MapsApiError`.
  5. `rows[0].elements[0].status !== "OK"` (ör. `NOT_FOUND`, `ZERO_RESULTS` — şehir adı tanınmadı/rota yok) → `MapsApiError`, açıklayıcı mesajla.
  6. Başarılıysa `parseDistanceMatrixResponse` ile `DistanceResult`'a çevir (`isMocked: false`).
- `parseDistanceMatrixResponse`: gerçek Google response şeklini işler; `distance.value`/`duration.value` sayısal alanlarını, `distance.text`/`duration.text` insan-okur metinlerini doğrudan Google'dan alır (mock'taki gibi kendi formatlama fonksiyonumuza gerek yok — bu aslında gerçek API'nin bir avantajı).
- **Kod tekrarını önleme:** `MockMapsProvider` içindeki `formatMockDuration` mock'a özel kalabilir (gerçek API kendi metnini veriyor), yani burada paylaşılacak bir yardımcı fonksiyon yok — bu maddeyi ilk analizde bir risk sanmıştım ama gerçek API'nin kendi `text` alanları olduğu için gereksizmiş, plana not düşüyorum.

### 1.3 KRİTİK BULGU — mesafe çağrısı sunucuya taşınmalı

Onay turundan sonra yapılan ikinci bir incelemede önemli bir mimari sorun tespit edildi: `app/calculator/page.tsx` bir **client component**'tir (`"use client"`). `GOOGLE_MAPS_API_KEY` ise `NEXT_PUBLIC_` önekine sahip değil — bu **kasıtlı ve doğru** bir tercih (API anahtarını tarayıcıya/istemci paketine sızdırmamak için). Ama bunun sonucu olarak `process.env.GOOGLE_MAPS_API_KEY`, tarayıcıda çalışan kodda **her zaman `undefined`** olur. Yani `GoogleMapsProvider.getDistance` doğrudan `page.tsx`'ten çağrılırsa, `.env.local`'a gerçek bir anahtar girilmiş olsa bile `getMapsConfig()` her seferinde `MapsConfigError` fırlatır — entegrasyon hiçbir zaman çalışmaz. Ayrıca anahtarı istemciye taşımak (`NEXT_PUBLIC_` yapmak) güvenlik açısından yanlış olurdu (anahtar tarayıcı ağ isteklerinde görünür hale gelir).

**Düzeltme — sunucu tarafı Route Handler:** Yeni bir dosya: `app/api/distance/route.ts` (Next.js Route Handler, sunucuda çalışır, env değişkenlerine sorunsuz erişir).

- `POST /api/distance` — gövde: `{ origin: string; destination: string; avoidTolls?: boolean }`.
- Handler içinde: `GOOGLE_MAPS_API_KEY` set değilse **ve** `process.env.NODE_ENV !== "production"` ise `MockMapsProvider` kullanılır; aksi halde `getMapsService()` (→ `GoogleMapsProvider`) kullanılır. **Bu, Açık Karar #4'te onaylanan "geliştirme için mock'a otomatik düşsün" kararının doğru, tek uygulama noktasıdır** — istemci tarafının bunu bilmesine hiç gerek kalmaz.
- `MapsConfigError`/`MapsApiError` yakalanır, uygun HTTP status koduyla (`500`/`502` gibi) ve `{ error: string }` gövdesiyle client'a iletilir.
- Başarılı durumda `DistanceResult` JSON olarak döner.

**`app/calculator/page.tsx` değişikliği:** `fetchDistance`, artık `mapsProvider.getDistance(...)` yerine `fetch("/api/distance", { method: "POST", body: JSON.stringify({ origin, destination, avoidTolls }) })` çağırır; `response.ok` değilse mevcut genel `catch`/hata mesajı akışı **değişmeden** kullanılır (yeni bir UI hata kodu gerekmez). `MockMapsProvider`/`getMapsService` importları `page.tsx`'ten tamamen kalkar — bunlar artık yalnızca yeni route handler içinde kullanılır.

Bu, ilk taslakta (Bölüm 1.3'ün önceki hâli) atlanmış, ikinci geçişte yakalanmış önemli bir düzeltmedir; olmadan entegrasyon hiçbir zaman gerçek veri döndürmezdi.

---

## 2. Fuel Price Service Mimarisi (`lib/fuel/`)

### 2.1 PRD ile fark — şeffaf not

`docs/PRD.md` Bölüm 13 (Teknik Mimari), bu servisi `lib/pricing/` altında öngörmüştü. Bu sprintin talimatı `lib/fuel/` diyor. Ben bu sprintte **talimata uyacağım** (`lib/fuel/`), ama bu, PRD ile kod arasında bir sapma yaratır. Sprint sonunda PRD'nin Teknik Mimari bölümünün `lib/pricing/` yerine `lib/fuel/` olarak güncellenmesi önerilir (ayrı, küçük bir dokümantasyon işi — bu sprintin kodlama kapsamında değil).

### 2.2 Önerilen dosya yapısı ve sorumluluklar

```
lib/fuel/
  fuelTypes.ts     # Paylaşılan tipler
  fuelMock.ts      # Manuel/statik config verisi
  fuelProvider.ts  # Provider arayüzü + implementasyonlar
  fuelService.ts   # Dışa açılan tek giriş noktası (factory)
```

**`fuelTypes.ts`**
- `FuelType`'ı **yeniden tanımlamaz**, `lib/costs.ts`'ten import eder (`import type { FuelType } from "../costs"`) — tek gerçek kaynak (single source of truth) korunur, tip driftini önler.
- `FuelPrice` arayüzü: `{ fuelType: FuelType; pricePerUnit: number; unit: "L" | "kWh"; city?: string; updatedAt: string; source: "manual-config" | "live-api" }`. `source` ve `updatedAt` alanları, PRD'nin "tahmini/gerçek veri ayrımı" ilkesini bu servis seviyesinde de somutlaştırır.

**`fuelMock.ts`**
- `MANUAL_FUEL_PRICES: Record<FuelType, number>` — manuel güncellenebilir config verisi.
- **Bilinen, geçici çakışma:** `lib/costs.ts`'teki `DEFAULT_FUEL_PRICES` bu sprintte **dokunulmadan** kalacağı için (bkz. Bölüm 5), aynı fiyatlar iki ayrı yerde (`costs.ts` ve `fuel/fuelMock.ts`) tanımlanmış olacak. Bu kasıtlı ve geçicidir; bir sonraki sprintte `costs.ts`'in bu servisten okuyacak şekilde bağlanmasıyla çözülür. Şimdiden not düşülmesi, ileride "neden iki fiyat listesi var" sorusunun önüne geçer.

**`fuelProvider.ts`**
- `FuelPriceProvider` arayüzü: `getPrice(fuelType: FuelType, city?: string): Promise<FuelPrice>` — `lib/maps.ts`'teki kanıtlanmış `MapsProvider` deseniyle birebir aynı şekilde tasarlanır (tutarlılık, "React/mimari best practice").
- `ConfigFuelPriceProvider implements FuelPriceProvider` — `fuelMock.ts`'ten okuyan, `source: "manual-config"` dönen implementasyon. Gerçek API bağlanacağı zaman (gelecek sprint) `LiveFuelPriceProvider` aynı arayüzle eklenecek; bu dosyaya veya çağıran koda dokunulmayacak.

**`fuelService.ts`**
- `getFuelPriceService()` / `setFuelPriceServiceForTesting()` — yine `getMapsService()`/`setMapsServiceForTesting()` ile birebir aynı factory deseni.
- Kolaylık fonksiyonu: `getFuelPrice(fuelType, city?)`.

### 2.3 Bu sprintte NE YAPILMAYACAK (kapsam sınırı)

Talimat #5 "`calculateFuelCost` ... aynı kalacak" dediği için, `lib/fuel/` **bu sprintte `lib/costs.ts`'e bağlanmayacak**. Yani `fuelService` yazılmış, tip-güvenli ve bağımsız çalışır durumda olacak ama henüz hiçbir yerden çağrılmayacak — tamamen "hazır ama pasif" bir modül olarak kalacak (tıpkı `GoogleMapsProvider`'ın bu sprint öncesindeki durumu gibi). Bu, PRD'nin orijinal Sprint 2 planından (o zaman hemen bağlanması öngörülmüştü) bilinçli bir sapmadır — bu sprintin daha katı "mimariyi bozma" kuralına uymak için.

---

## 3. "Otoyol Tercihi" Adımı

### 3.1 Sıralama sorunu (analiz sırasında tespit edildi) ve çözümü

Mesafe şu an **`toCity` adımında** (adım 2), hedef şehir seçilir seçilmez `fetchDistance(fromCity, city)` ile çekiliyor. Otoyol Tercihi ise akışta çok daha **sonra** (araç seçiminden sonra, adım 5 civarı) gelecek. Yani kullanıcı otoyol tercihini seçtiğinde, mesafe zaten (`avoidTolls` bilgisi olmadan) çekilmiş olacak.

**Çözüm:** İki fetch noktası olacak:
1. Mevcut `toCity` fetch'i **değişmeden kalır** — varsayılan (otoyol tercihi belirtilmemiş) mesafeyi hemen getirir; araçla gitmeyen kullanıcılar için bu zaten tek ve yeterli fetch'tir.
2. Otoyol Tercihi adımında bir seçenek tıklandığında, **yalnızca `"avoid"` seçilirse** `fetchDistance(fromCity, toCity, { avoidTolls: true })` ile **ikinci bir fetch** tetiklenir (bu da, 1.3'te tanımlanan `/api/distance` route'una POST atarak) ve `distanceKm`/süre günceller. `"Otoyolları Kullan"` seçilirse ek bir çağrı yapılmaz (zaten elimizdeki varsayılan mesafe aynıdır) — bu, gereksiz Google Maps çağrısından kaçınarak maliyeti düşürür.
3. Bu ikinci fetch, kullanıcı "Kişi Sayısı" ve "Gün Sayısı" adımlarından geçerken arka planda tamamlanır; bu adımlar `distanceKm`'i hiç kullanmadığı için ek bir yükleniyor göstergesi gerekmez. Sonuç ekranına vardığında zaten var olan `isDistanceLoading` durumu, hâlâ bitmemişse otomatik olarak "Mesafe hesaplanıyor..." gösterir — **yeni UI kodu gerekmez.**

### 3.2 State ve akış değişiklikleri (`app/calculator/page.tsx`)

- Yeni state: `const [tollPreference, setTollPreference] = useState<"use" | "avoid" | "">("");`
- `StepKey` union'a `"tollPreference"` eklenir; `getStepSequence`'da `"vehicle"`'dan hemen sonra, yalnızca `transport === "car"` ise eklenir (PRD'nin Bölüm 8 akış şemasıyla birebir tutarlı sıra).
- Yeni adım ekranı: "Otoyolları Kullan" / "Otoyollardan Kaçın" — mevcut ulaşım seçim ekranıyla aynı buton stili (`rounded-2xl border p-6`), iki büyük kart.
- **Reset kuralları (mevcut desenle tutarlı):**
  - `transport` "car" dışına çevrilirse → `tollPreference` de `vehicleId` gibi sıfırlanır.
  - `fromCity` değişirse (mevcutta zaten `toCity`/mesafe sıfırlanıyor) → `tollPreference` **de sıfırlanmalı**, aksi halde kullanıcı yeni rota için tercihini yeniden seçmezse (state zaten dolu olduğundan "Devam" pasif olmaz) ikinci fetch tetiklenmez ve eski/yanlış mesafe kalır. Bu, analiz sırasında tespit edilen ince bir hata senaryosu.
  - `handleReset` ("Yeni Hesaplama") → `tollPreference` de sıfırlanır.

---

## 4. "Gidiş-Dönüş" Toggle'ı

### 4.1 Yerleşim

Yeni bir adım **değil**, mevcut bir adıma eklenen küçük bir toggle. Öneri: **`toCity` adımına**, şehir grid'inin altına, "Devam" butonundan önce — çünkü gidiş-dönüş, ulaşım tipinden bağımsız, doğrudan rotanın (şehir çiftinin) bir özelliğidir.

### 4.2 Wiring — yeni hesaplama motoru YOK

- Yeni state: `const [roundTrip, setRoundTrip] = useState(false);`
- `calculateTrip(...)` çağrısına tek eklenen alan: `roundTrip`. `lib/tripCalculator.ts` **hiç değişmez** — `roundTrip` zaten `FuelCalculationInput` ve `calculateMockTollCost`'a doğru şekilde akan, üretimde hazır bir alan.
- `trip` `useMemo`'sunun bağımlılık dizisine `roundTrip` eklenir.
- Google Maps isteğine **hiç yansımaz** — mesafe her zaman tek yön istenir; ×2 çarpımı zaten `costs.ts`/`tripCalculator.ts` içinde (değişmeden) yapılıyor. Bu maddenin Maps tarafında hiçbir etkisi yok, sadece hesaplama girdisi.

### 4.3 Sonuç ekranı tutarlılığı — ONAYLANDI, bu sprintte yapılacak

`TripResultSummary`'deki "Mesafe" bilgi kartı şu an tek yön `distanceKm`'i gösteriyor; `roundTrip` true olduğunda yakıt/HGS kalemleri içeride ×2 hesaplanmış oluyor ama kart hâlâ tek yön mesafeyi gösteriyor — kullanıcı için kafa karıştırıcı olabilirdi. **Karar (onaylandı):** `TripResultSummary`'ye opsiyonel `roundTrip: boolean` prop'u eklenip Mesafe kartında `"${distanceKm} km (gidiş-dönüş)"` gibi bir etiket gösterilecek; ayrıca otoyol tercihi için de küçük bir etiket eklenecek (örn. "Otoyollardan kaçınıldı" notu, `tollPreference === "avoid"` iken). Bu, hesaplama mantığına dokunmayan, salt görüntüleme amaçlı küçük bir prop eklemesidir.

---

## 5. Mimari Koruma — Değişen / Değişmeyen Dosyalar

| Dosya | Bu sprintte |
|---|---|
| `lib/costs.ts` | **Değişmez.** |
| `lib/tripCalculator.ts` | **Değişir** (küçük, geriye-dönük-uyumlu ekleme): `TripCalculationInput`'a opsiyonel bir alan eklenir (örn. `avoidTolls?: boolean`), `calculateMockTollCost` bu değere göre HGS'yi sıfırlayabilir. `calculateFuelCost` tek yakıt hesaplama kaynağı olmaya devam eder, imzası değişmez. |
| `lib/vehicles.ts` | **Değişmez.** |
| `components/ProgressBar.tsx`, `CitySearchInput.tsx`, `VehicleSelector.tsx`, `InfoCard.tsx` | **Değişmez.** |
| `lib/maps.ts` | Değişir: `GoogleMapsProvider` gerçek implementasyon, `DistanceRequest.avoidTolls` eklenir, `buildDistanceMatrixUrl`/`parseDistanceMatrixResponse` doldurulur. `MockMapsProvider`, `MapsProvider`, `getMapsService`, `setMapsServiceForTesting` **korunur.** |
| `lib/fuel/*.ts` (4 yeni dosya) | **Yeni**, bağımsız, henüz hiçbir yerden çağrılmıyor. |
| `app/api/distance/route.ts` (yeni dosya) | **Yeni.** 1.3'te açıklanan sunucu tarafı Route Handler; `getMapsService()`/`MockMapsProvider` seçimini ve geliştirme fallback'ini burada yapar. |
| `app/calculator/page.tsx` | Değişir: `fetchDistance` artık `/api/distance`'a `fetch` ile POST atıyor (doğrudan `mapsProvider` çağrısı yok); yeni `tollPreference`/`roundTrip` state'leri; yeni "Otoyol Tercihi" adımı; `calculateTrip` çağrısına `roundTrip` eklenir; reset/invalidation kuralları genişler. |
| `components/TripResultSummary.tsx` | **Değişir**: `roundTrip` ve otoyol tercihi için küçük, opsiyonel prop eklemeleri alır (Bölüm 4.3). |

---

## 6. Kod Kalitesi Kontrol Listesi

- `npx tsc --noEmit` ve `npx eslint .` her aşamadan sonra sıfır hata/uyarı ile geçmeli (önceki sprintlerdeki gibi).
- Yeni `lib/fuel/` dosyaları, mevcut `lib/maps.ts`/`lib/tripCalculator.ts` ile aynı üslup: Türkçe açıklama yorumları, `Error` alt sınıfları ile net hata mesajları, saf/test edilebilir fonksiyonlar.
- `GoogleMapsProvider` içinde `fetch` hataları (ağ hatası, JSON parse hatası) da yakalanıp `MapsApiError`'a çevrilmeli; yakalanmamış bir `throw` sızıntısı bırakılmamalı.
- Yeni state'ler için React best practice: `useCallback`/`useMemo` bağımlılık dizileri eksiksiz (mevcut kodda zaten titizlikle uygulanmış bir desen — aynı standart korunacak).
- Hiçbir yerde API anahtarı/gizli değer kod içine gömülmeyecek; yalnızca `process.env.GOOGLE_MAPS_API_KEY` üzerinden okunacak (zaten mevcut `getMapsConfig()` deseni).

---

## 7. Kararlar — Sonuçlandı

Aşağıdaki 3 madde kullanıcıya soruldu ve yanıtlandı; 4. madde bu sprintin kapsamı dışında bırakıldı (aşağıda gerekçesiyle):

1. **HGS (Otoyol) kalemi, "Otoyollardan Kaçın" seçilince sıfırlansın mı? → KARAR: Seçenek B (Evet, küçük bir alan eklenir).**
   `TripCalculationInput`'a küçük, opsiyonel, geriye-dönük-uyumlu bir alan eklenecek (örn. `avoidTolls?: boolean`); `calculateMockTollCost` bu değere göre HGS'yi sıfırlayabilecek. Bu, `lib/tripCalculator.ts`'e küçük bir dokunuş gerektirir (bkz. Bölüm 5) — ama `calculateFuelCost`'un tek yakıt kaynağı olma özelliği ve mevcut fonksiyon imzaları korunur, yalnızca opsiyonel/additive bir alan eklenir.
2. **`TripResultSummary`'ye gidiş-dönüş/otoyol tercihi etiketleri eklensin mi? → KARAR: Evet, bu sprintte eklenecek.** (bkz. Bölüm 4.3)
3. **Geliştirme/manuel test kolaylığı — anahtar yokken yerelde nasıl çalışılacak? → KARAR: Geliştirme ortamında otomatik olarak Mock'a düşülecek.**
   Bu fallback, ilk taslakta düşünüldüğü gibi `page.tsx` içinde değil, **Bölüm 1.3'te tanımlanan `app/api/distance/route.ts` sunucu route handler'ı içinde** uygulanacak — çünkü mesafe çağrısının kendisi de (client/server env değişkeni sorunuyla ilgili kritik bulgu nedeniyle) sunucuya taşınıyor. Bu, kararın doğal ve tek doğru uygulama noktasıdır.
4. **`transportType`'ın hâlâ `calculateTrip`'e geçilmemesi** (mevcut, bu sprintten önceki bir eksiklik — plane/bus/train seçilse bile yakıt maliyeti iç hesapta sıfırlanmıyor, yalnızca UI'da metinle gizleniyor). Bu madde kullanıcıya sorulan 3 soruluk onay setine dahil edilmedi; talimattaki "SADECE" (yalnızca) kısıtı gereği **bu sprintin kapsamı dışında bırakılıyor** — dokunulmayacak, mevcut davranış (UI'da gizli ama iç hesapta sıfırlanmamış) aynen kalacak. Bilinen teknik borç olarak not düşülür, ayrı bir sprintte ele alınabilir.

---

## 8. Bu Sprintin Kapsamı Dışında Kalanlar (netlik için)

- Konaklama Tipi adımı (PRD Sprint 3 — henüz kodda yok, bu sprintte de eklenmiyor).
- Fuel Price Service'in `lib/costs.ts`'e bağlanması (bir sonraki sprint).
- Google Maps Routes API'ye geçiş / Rota Tercihi (Hızlı/Ekonomik/Dengeli) (PRD V2 Sprint 6).
- Elektrikli araç gelişmiş şarj modeli, Tren Uygunluk Motoru, Karşılaştırma Ekranı (PRD V2/V3).
- Otomatik test altyapısı kurulumu (Jest/Vitest) — bu sprintte yok, yalnızca mevcut `tsc`/`eslint` kontrolleri kullanılacak.

---

## 9. Onaydan Sonra Uygulama Sırası

1. `lib/fuel/` dosyalarını oluştur (bağımsız, riski en düşük iş — hiçbir mevcut dosyayı etkilemez).
2. `lib/maps.ts`: `DistanceRequest.avoidTolls`, `GoogleMapsProvider`, URL builder/parser'ı tamamla.
3. `lib/tripCalculator.ts`: küçük, opsiyonel `avoidTolls`/`tollPreference` alanını `TripCalculationInput`'a ve `calculateMockTollCost`'a ekle (Karar #1).
4. `app/api/distance/route.ts` (yeni): `getMapsService()`/`MockMapsProvider` seçimini ve dev-fallback'i içeren POST handler'ı oluştur (Bölüm 1.3, Karar #3).
5. `app/calculator/page.tsx`: `fetchDistance`'ı doğrudan `mapsProvider` çağrısından `/api/distance`'a `fetch` ile POST atacak şekilde değiştir; `roundTrip` toggle'ını `toCity` adımına ekle ve `calculateTrip`'e bağla.
6. `app/calculator/page.tsx`: "Otoyol Tercihi" adımını ekle, ikinci (koşullu, `avoidTolls`'lı) `fetchDistance` çağrısını bağla, reset kurallarını genişlet.
7. `components/TripResultSummary.tsx`'e `roundTrip`/otoyol tercihi için küçük prop eklemeleri (Karar #2).
8. `tsc --noEmit` + `eslint .` ile tüm proje genelinde doğrulama.
9. Manuel akış testi: araç + otoyol kullan / araç + otoyol kaçın / uçak-otobüs-tren (adım atlama doğru mu) / gidiş-dönüş açık-kapalı senaryoları / anahtarsız yerel geliştirme (mock fallback çalışıyor mu).
