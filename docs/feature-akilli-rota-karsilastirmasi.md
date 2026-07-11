# Rotaly — Ürün Özellik Tasarım Dokümanı: Akıllı Rota Karşılaştırması

**Doküman sahibi:** Product Management / Senior Software Architecture
**Durum:** Taslak — geliştirmeye kapalı (bu doküman yalnızca tasarım içindir, kod içermez)
**Referans:** `docs/PRD.md` v1.0
**İlişkili PRD maddeleri:** Bölüm 5 (V2 — Sprint 5 Gerçek Mesafe, Sprint 6 Rota Tercihi), Bölüm 6 (V3 — Karşılaştırma Ekranı), Bölüm 13 (Teknik Mimari)

---

## 1. Özet ve Amaç

Bugüne kadar Rotaly, kullanıcıya tek bir sayı (toplam bütçe) ve kalem kırılımı sunuyordu. "Otoyol Tercihi" adımı (PRD Sprint 1/5) da kullanıcıya bu kararı **rotayı görmeden, sonuçları kıyaslamadan, önden ve kör** verdiriyor.

**Akıllı Rota Karşılaştırması**, bu kör kararı ortadan kaldırır: kullanıcı otoyollu ve otoyolsuz rotayı aynı anda, aynı haritada, aynı ekranda maliyet/süre farkıyla birlikte görür ve seçimini **sonuçları gördükten sonra** yapar. Bu, PRD'nin vizyon cümlesiyle ("kullanıcıların seyahat öncesinde en doğru ulaşım kararını verebilmesini sağlayan") birebir örtüşen, kararı veriden görsel karara taşıyan bir özelliktir.

### 1.1 Mevcut PRD maddeleriyle ilişki (önemli, karışıklığı önlemek için)

Rotaly'nin yol haritasında üç madde bu özelliğe komşu ama **farklı** kapsamlardadır:

| Madde | Ne karşılaştırır | Kapsam |
|---|---|---|
| Otoyol Tercihi (Sprint 1/5) | Yok — kullanıcı sonucu görmeden "kullan/kaçın" seçer | Mevcut, V1/V2 |
| Rota Tercihi (Sprint 6) | En Hızlı / En Ekonomik / Dengeli — 3 senaryo, ama görsel değil, harita yok | Planlı, V2 |
| **Akıllı Rota Karşılaştırması (bu doküman)** | Otoyollu vs Otoyolsuz — 2 senaryo, **harita üzerinde eş zamanlı görsel** + maliyet farkı + doğal dilde yorum | Yeni, konumu Bölüm 6'da tartışılıyor |
| Karşılaştırma Ekranı (Sprint 10, V3) | Araba / Uçak / Otobüs / Tren — **ulaşım tipleri arası**, rota değil | Planlı, V3 |

**Karar (onaylandı):** Akıllı Rota Karşılaştırması, mevcut "Otoyol Tercihi" adımının **yerini alır**. Kullanıcıya önden kör bir "kullan/kaçın" sorusu sormak yerine, akış doğrudan sonuç ekranına gider ve karşılaştırma orada, sayılarla birlikte yapılır. Bu, Sprint 1/5'te yazılmış `tollPreference` state'ini ve akış adımını gereksiz kılar; o kod bu özelliğin geliştirme sprintinde **kaldırılacak** ("Otoyol Tercihi" adımı `getStepSequence`'tan çıkarılacak, ilgili state'ler ve UI bloğu temizlenecek) — kullanılmayan ölü kod olarak bırakılmayacak. Bu, ilgili sprintin teknik plan dokümanında (bu özellik uygulamaya alınmadan önce hazırlanacak) somut bir görev maddesi olarak yer almalı.

---

## 2. Kullanıcı Akışı (verilen senaryo üzerinden)

```
İstanbul → Antalya → Kendi Aracım → Toyota Corolla Hybrid → 2 kişi → 5 gün
                                                                        │
                                                                        ▼
                                                          Sonuç Ekranı (yeni hâli)
                                                                        │
                                        ┌───────────────────────────────┴───────────────────────────────┐
                                        ▼                                                                 ▼
                          Harita: iki rota eş zamanlı çizili                              İki rota kartı + Rotaly Yorumu
                     (Otoyollu = mavi çizgi, Otoyolsuz = yeşil kesikli çizgi)              (mesafe, süre, yakıt, HGS, toplam)
                                        │                                                                 │
                                        └───────────────────────────────┬───────────────────────────────┘
                                                                        ▼
                                                     Kullanıcı bir rotayı seçer ("Bu Rotayı Seç")
                                                                        ▼
                                                   Toplam bütçe, seçilen rotaya göre kesinleşir
```

Mevcut 8 adımlık akışta (PRD Bölüm 8) bu ekran, "Otoyol Tercihi" adımının (Adım 5) yerine geçer ve **Sonuç Ekranı'nın bir parçası** olarak konumlanır — yeni bir adım eklenmez, mevcut Sonuç Ekranı bu iki rotalı görünümle zenginleşir.

---

## 3. API Seçimi: Routes API vs Directions API vs TollGuru Toll API

Bu özelliğin iki teknik zorunluluğu var: (a) haritada gerçek bir rota **çizgisi** (polyline) göstermek, (b) aynı şehir çifti için **iki farklı senaryo** (otoyollu/otoyolsuz) almak. Rotaly'nin Sprint 15'te zaten entegre ettiği **Distance Matrix API bu ikisini de yapamaz** — yalnızca sayısal mesafe/süre döner, hiçbir rota geometrisi (polyline) içermez. Dolayısıyla bu özellik için Distance Matrix'in yanına (onun yerine değil) yeni bir entegrasyon noktası gerekir. Seçenekler:

### 3.1 Directions API (Legacy)

**Artıları:**
- Basit, düz GET isteği; mevcut Sprint 15 `buildDistanceMatrixUrl` deseniyle zihinsel model olarak tutarlı.
- `alternatives=true` ve `avoid=tolls` parametreleriyle hem alternatif rotalar hem otoyolsuz rota istenebilir.
- Sabit, öngörülebilir fiyat: 1000 istek başına 5 USD.
- `overview_polyline` alanı doğrudan haritada çizilebilir bir polyline döner.

**Eksileri:**
- Google tarafından **"Legacy" (2025 Mart itibarıyla)** statüsüne alındı — yeni özellik geliştirmesi durdu, uzun vadede Routes API'ye geçiş bekleniyor. Yeni bir entegrasyon için başlangıç noktası olarak önerilmiyor.
- Trafik-duyarlı süre tahmini ve HGS/toll gerçek fiyat bilgisi (`tollInfo`) **yok** — otoyol ücretini kendi mock formülümüzle hesaplamaya devam etmemiz gerekir (bu zaten mevcut mimaride var, dezavantaj değil ama avantaj da değil).
- Field mask desteği yok — her istek, ihtiyaç duyulmayan alanlar dahil tam bir yanıt döner; maliyet optimizasyonu sınırlı.

### 3.2 Routes API (`computeRoutes`)

**Artıları:**
- Google'ın önerdiği, aktif geliştirilen, Directions + Distance Matrix'in **yerini almak üzere tasarlanmış** modern servis.
- `computeAlternativeRoutes: true` ile tek istekte üçe kadar alternatif rota; `routeModifiers.avoidTolls` ile otoyolsuz senaryo — bizim ihtiyacımız olan "iki deterministik senaryo" (otoyollu/otoyolsuz) için yine de **iki ayrı istek** (biri `avoidTolls: false`, biri `true`) önerilir, çünkü "alternatifler" Google'ın kendi kriterine göre seçilir, otoyol içerip içermediği garanti edilmez.
- **Field mask (`X-Goog-FieldMask`) zorunlu** — yalnızca ihtiyaç duyulan alanlar (`routes.duration`, `routes.distanceMeters`, `routes.polyline.encodedPolyline`) istenir; bu hem maliyeti hem gecikmeyi düşürür.
- `extraComputations: ["TOLLS"]` ile `routes.travelAdvisory.tollInfo.estimatedPrice` alanı istenebilir — Google'ın **kendi tahmini HGS fiyatını** döndürme potansiyeli var. **Ancak bu, yalnızca seçili ülke/şehirlerde destekleniyor; Türkiye'nin bu kapsamda olup olmadığı doğrulanmadı** — bu, entegrasyon öncesi mutlaka test edilmesi gereken açık bir risktir (bkz. Bölüm 3.5). Bu belirsizlik, aşağıdaki 3.3'te ele alınan TollGuru seçeneğinin gündeme gelme sebebidir.
- Trafik-duyarlı (`TRAFFIC_AWARE`) süre hesaplama, ileride "Rota Tercihi" (Sprint 6) ile doğrudan entegre olur.

**Eksileri:**
- POST + JSON body + header tabanlı istek şekli, mevcut Sprint 15 `buildDistanceMatrixUrl` (GET, query param) deseninden farklı — kod tabanına yeni bir istek şekli (ve yeni bir parser) getirir. Bu, "mimariyi bozma" ilkesi açısından tamamen yeni, izole bir modül gerektirir (bkz. Bölüm 4) ama mevcut `lib/maps.ts`'e dokunmaz.
- Kademeli (tier tabanlı) fiyatlandırma: istenen alan setine göre üç kademe — **Basic (~5 USD/1000 istek)**, **Advanced (~10 USD/1000 istek)**, **Preferred (~15 USD/1000 istek)**. Polyline + temel mesafe/süre **Basic** kademesinde kalır; toll bilgisi (`tollInfo`) istenirse **Preferred** kademesine geçilir — maliyet üç kata kadar artabilir. Bu nedenle V1 aşamasında toll bilgisi Google'dan **istenmemeli**, Rotaly'nin kendi mock/gerçek HGS hesaplaması kullanılmaya devam edilmeli; Google toll fiyatı yalnızca ileride, Türkiye desteği doğrulandıktan sonra, bilinçli bir maliyet kararıyla eklenmelidir.

### 3.3 TollGuru Toll API (üçüncü seçenek — HGS'ye özel sağlayıcı)

Araştırma sırasında ortaya çıkan, ilk taslakta değerlendirilmemiş bir seçenek: **TollGuru** (`tollguru.com`), Türkiye'ye özel bir geçiş ücreti hesaplayıcısı ve buna karşılık gelen bir **Toll API** sunuyor (`tollguru.com/toll-calculator-turkey`). Google'ın `tollInfo`'sundaki en büyük belirsizlik — Türkiye desteğinin doğrulanmamış olması — TollGuru için geçerli değil; ürün doğrudan HGS/OGS'yi hedef alıyor.

**Ne sunuyor:**
- Origin/destination (+ waypoint) verildiğinde: geçiş ücreti + yakıt maliyeti dökümü, en ucuz/en hızlı rota önerisi, rota üzerindeki her gişenin haritada gösterilebilir konumu ve ücreti.
- Bu, Bölüm 3.1-3.2'de tarif edilen "Google'dan geometri al + kendi HGS formülünü uygula" iki parçalı yaklaşımı **tek bir sağlayıcıda birleştirme potansiyeli** taşıyor — TollGuru kendi arka planında bir harita sağlayıcısına (kendi ifadeleriyle "varsayılan harita API'si") geocode/yön isteği atıp üzerine gerçek HGS/OGS fiyatını bindiriyor.

**Fiyatlandırma:** 14 gün ücretsiz deneme (iş hesabı için günde 150 işlem, aylık karşılığı ~4.500 işlem). Sonrasında kademeli abonelik: Starter 80 USD/ay (5.000 işlem), Basic 260 USD/ay (20.000), Standard 900 USD/ay (100.000), Corporate 4.000 USD/ay (500.000), üzeri özel teklif. Limit aşımı pay-as-you-go değil, plan birim fiyatından orantılı faturalanıyor. Bu, Google Routes API'nin (1000 istekte 5-15 USD) kademeli ama daha ince taneli fiyatlandırmasına kıyasla **daha yüksek taban maliyetli, abonelik tabanlı** bir model — düşük hacimde (V1/V2 demo aşaması) Google'a göre orantısız pahalı olabilir, yüksek hacimde ise rekabetçi hâle gelebilir.

**Netleştirilmemiş, entegrasyon öncesi kapatılması gereken iki nokta:**
- Tam istek/yanıt şeması (`tollguru.com/toll-api-docs`) bu araştırmada sonuna kadar incelenemedi; asıl mimari karardan önce geliştirici dokümanının tamamı okunmalı.
- Ticari kullanım şartları (TollGuru'nun hesapladığı fiyatı bir SaaS ürününe gömüp son kullanıcıya göstermenin lisans/ToS açısından serbest olup olmadığı) doğrulanmadı — PRD Bölüm 11'deki "yasal/ticari kısıtlar" riskiyle aynı kategoride, sözleşme şartları okunmadan karar verilmemeli.

### 3.4 Karşılaştırma Tablosu

| Kriter | Directions API (Legacy) | Routes API | TollGuru Toll API |
|---|---|---|---|
| Statü | Legacy (Mart 2025'ten beri) | Aktif, önerilen | Aktif, HGS'ye özel niş sağlayıcı |
| Polyline desteği | Var (`overview_polyline`) | Var (`polyline.encodedPolyline`) | Var (gişe konumlarıyla birlikte) |
| Otoyolsuz rota isteme | `avoid=tolls` | `routeModifiers.avoidTolls` | Ürünün doğal çıktısı (en ucuz/en hızlı rota ayrımı) |
| Gerçek HGS fiyatı | Yok | Var ama TR desteği doğrulanmadı, ekstra maliyetli (Preferred) | Var, Türkiye'ye özel olarak tasarlanmış (asıl güçlü yanı) |
| Fiyat modeli | Sabit, 5 USD / 1000 istek | Kademeli, 5-15 USD / 1000 istek (alan setine göre) | Aylık abonelik, 80-4.000+ USD (5.000-500.000 işlem); 14 gün ücretsiz deneme |
| Düşük hacimde (V1/V2 demo) maliyet | Düşük | Düşük | Muhtemelen orantısız yüksek (taban abonelik) |
| Maliyet kontrolü | Zayıf (field mask yok) | Güçlü (field mask zorunlu) | Plan bazlı, ince taneli değil |
| Geleceğe uygunluk | Düşük (geliştirme durdu) | Yüksek | Niş ama Türkiye'ye özel derinlik sunuyor |

### 3.5 Öneri

**Routes API (`computeRoutes`), yalnızca Basic kademedeki alanlarla** (`routes.duration`, `routes.distanceMeters`, `routes.polyline.encodedPolyline`) kullanılsın; **HGS fiyatı için ne Google'ın `tollInfo`'su ne de TollGuru** — Rotaly'nin kendi, **resmi KGM verisine dayalı** HGS tarife servisi (bkz. Bölüm 3.6 — bu, ilk taslaktaki belirsiz "ileride gerçek HGS tarife servisi" referansının artık somut bir karara dönüşmüş hâlidir) tek kaynak olsun. Gerekçe: Directions API'nin legacy statüsü onu yeni bir entegrasyon noktası için savunulamaz kılıyor; TollGuru'nun Türkiye derinliği cazip ama abonelik maliyeti düşük hacimde orantısız ve ToS henüz doğrulanmadı; buna karşılık **KGM'nin kendisi zaten resmi, ücretsiz, halka açık bir tarife kaynağı** — üçüncü bir ticari sağlayıcıya ihtiyaç duymadan aynı doğruluk hedefine ulaşmayı mümkün kılıyor. Google'dan yalnızca **geometri ve süre/mesafe** alınmalı.

> **Doğrulama gereken açık nokta (kod yazımından önce, ayrı ve düşük riskli bir adım olarak planlanmalı):** Gerçek bir `GOOGLE_MAPS_API_KEY` ile İstanbul–Antalya gibi bir rota için Routes API'nin `avoidTolls: true`/`false` senaryolarında gerçekten farklı polyline/mesafe/süre döndürdüğü doğrulanmalı.

### 3.6 Resmi KGM Verisine Dayalı HGS Servisi (seçilen yaklaşım: kürasyonlu şehir-çifti tablosu)

**Kaynak — doğrulandı:** `kgm.gov.tr` (Karayolları Genel Müdürlüğü), otoyol ve köprü geçiş ücretlerini **19 ayrı resmi PDF belgesi** olarak yayımlıyor (`kgm.gov.tr/.../UcretlerYeni.aspx`) — her biri bir otoyol kesimi veya köprü için (ör. "15 Temmuz Şehitler ve Fatih Sultan Mehmet Köprüleri", "Osmangazi Köprüsü", "1915 Çanakkale Köprüsü", "Anadolu Otoyolu", "Gebze-Orhangazi-İzmir Otoyolu" vb.). Bu, **tek bir birleşik veri seti veya API değil**; bazı kesimler doğrudan KGM tarafından, bazıları Yap-İşlet-Devret (özel işletmeci) modeliyle işletiliyor ve **farklı takvimlerde güncelleniyor** (en son güncelleme 1 Temmuz 2026). Bu, önceki bulgumuzdaki "Türkiye desteği doğrulanmadı" belirsizliğini ortadan kaldırıyor ama yeni bir gerçeği ortaya koyuyor: resmi kaynak var, ama **makine-okunur/tekilleştirilmiş değil** — bir mühendislik/kürasyon adımı gerektiriyor.

**Seçilen yaklaşım (B — kürasyonlu şehir-çifti tablosu):** Rotaly'nin PRD'de zaten tanımlı olan **Tren Uygunluk Motoru** deseniyle (statik/curated veri seti, PRD Sprint 9) birebir aynı mantık: rota geometrisini bu 19 kesimle otomatik coğrafi olarak eşleştirmek yerine (bu, ciddi bir geodata yatırımı gerektirir — KGM koordinat yayımlamıyor), **en popüler şehir çiftleri için** (İstanbul-Antalya, İstanbul-İzmir, İstanbul-Ankara, İstanbul-Bodrum, Ankara-İzmir vb.) hangi resmi PDF(ler)den/kesim(ler)den geçildiği elle araştırılıp bir tabloya girilir; listede olmayan şehir çiftlerinde mevcut mesafe-bazlı tahmine (`calculateMockTollCost`) düşülür. Bu, tam kapsam yerine **yüksek trafikli rotalarda gerçek resmi doğruluk, geri kalanında mevcut tahmini davranış** anlamına gelir — düşük efor, yüksek pazarlanabilir değer.

**Önerilen veri yapısı (kavramsal, Bölüm 4'teki mimariye bağlanacak):**

```
lib/tolls/
  tollTariffTypes.ts     # TollCorridor { fromCity, toCity, segments: string[], vehicleClassPrices, source, updatedAt }
  tollTariffMock.ts       # Kürasyonlu şehir-çifti tablosu — her satırda hangi KGM PDF'sine dayandığı (ör.
                           # "kaynak: kgm.gov.tr, 12-Gebze-Orhangazi-Izmir.pdf, güncelleme: 2026-07-01") kayıtlı
  tollTariffProvider.ts   # TollTariffProvider arayüzü + CuratedTollTariffProvider implementasyonu
  tollTariffService.ts    # getTollTariffService() factory — lib/fuel/'daki fuelService.ts deseniyle birebir aynı
```

Bu, `lib/fuel/`'ün "manuel config, ileride canlıya bağlanabilir arayüz" desenini birebir tekrarlar; farkı, `fuelMock.ts`'in aksine her satırın **doğrulanabilir bir resmi kaynağa ve tarihe** atıfta bulunmasıdır (PRD'nin "tahmini vs gerçek" şeffaflık ilkesinin somut bir uygulaması).

**Bakım/güncellik riski (önemli, PRD Bölüm 11'deki genel riskle aynı kategoride):** KGM tarifeleri düzenli (en az yıllık, bazı kesimlerde daha sık) güncelleniyor — kürasyonlu tablonun "son kontrol tarihi" alanı olmalı ve bu tarih periyodik olarak (ör. her çeyrekte) gözden geçirilmeli; aksi halde zamanla "resmi ama güncelliğini yitirmiş" bir veri kaynağına dönüşür.

**PRD ile önemli bir netleştirme:** PRD Sprint 7, bu adımı "canlı veri sağlayıcısına bağlanma" (`LiveFuelPriceProvider` benzeri) olarak çerçevelemişti. Ancak KGM'nin **canlı/sorgulanabilir bir API'si yok** — yalnızca periyodik PDF yayını var. Dolayısıyla bu servis PRD'nin öngördüğü anlamda hiçbir zaman tam "canlı" olmayacak; olabileceği en iyi hâli **"resmi kaynaklı, periyodik olarak elle doğrulanan"** bir veridir. Bu, PRD'nin Sprint 7 tanımına küçük ama dürüst bir düzeltme olarak işlenmeli (ayrı bir PRD revizyonu gerektirir, bu doküman kapsamında değil).

---

## 4. Teknik Mimari

PRD Bölüm 13'te tarif edilen hedef `lib/` yapısına (domain bazlı klasörler, `services/` içinde izole dış API adaptörleri) sadık kalınarak, istenen `lib/maps/routeComparison/`, `components/`, `services/` yapısı şöyle önerilir:

```
lib/
  maps/
    routeComparison/
      routeComparisonTypes.ts      # RouteOption, RouteComparisonResult, RouteComparisonRequest tipleri
      routeComparisonMock.ts       # Deterministik mock rota çifti (test/geliştirme)
      routeComparisonProvider.ts   # RouteComparisonProvider arayüzü + Mock/Google implementasyonları
      routeComparisonService.ts    # getRouteComparisonService() / setRouteComparisonServiceForTesting() factory
      compareRoutes.ts             # Orchestrator: iki rotayı da alır, lib/tolls/'tan (bkz. Bölüm 3.6) şehir
                                    # çifti eşleşiyorsa resmi HGS'yi, eşleşmiyorsa calculateMockTollCost'u
                                    # kullanarak Rotaly'nin yakıt/HGS hesabıyla birleştirir, farkı ve
                                    # "Rotaly Yorumu" metnini üretir (UI'dan bağımsız, saf fonksiyon)
  tolls/                          # Bölüm 3.6'da tanımlanan resmi KGM tarife servisi (bağımsız, lib/fuel/ ile
                                    # aynı Provider/factory deseninde: tollTariffTypes/Mock/Provider/Service.ts)

app/
  api/
    route-comparison/
      route.ts                     # Sunucu tarafı Route Handler — Sprint 15'teki app/api/distance/route.ts
                                    # ile birebir aynı desen: GOOGLE_MAPS_API_KEY sunucuda okunur, dev'de
                                    # anahtar yoksa Mock'a düşer, client bu route'a fetch ile POST atar.

components/
  routeComparison/
    RouteComparisonMap.tsx          # Harita bileşeni: iki polyline'ı eş zamanlı çizer, seçili rotayı vurgular
    RouteOptionCard.tsx             # Tek bir rotanın kartı: mesafe/süre/yakıt/HGS/toplam + "Bu Rotayı Seç" butonu
    RouteComparisonSummary.tsx      # "Rotaly Yorumu" kutusu — fark metnini gösterir
    RouteComparisonToggle.tsx       # Mobilde rotalar arası geçiş için sekme/segment kontrolü
```

### 4.1 Sorumluluk ayrımı ve mevcut mimariyle ilişki

- **`routeComparisonTypes.ts`**, `lib/maps.ts`'teki `DistanceRequest`/`DistanceResult`'ı **genişletmez, yeniden tanımlamaz** — bu özelliğin ihtiyacı (polyline, iki senaryo, fark hesabı) mevcut basit mesafe tipinden yeterince farklı olduğu için ayrı bir `RouteOption { distanceKm, durationMinutes, polyline, avoidTolls }` tipi tanımlanır. Bu, `lib/fuel/` klasöründe zaten uygulanan "kendi bağımsız tip kümesi, ortak olanı import et" desenine sadıktır (`FuelType` gibi, gerekirse `MapsConfigError`/`MapsApiError` mevcut `lib/maps.ts`'ten import edilip yeniden kullanılabilir — hata tipleri için tekrar icat gerekmez).
- **`routeComparisonProvider.ts`**, tam olarak `MapsProvider`/`FuelPriceProvider` deseni: bir arayüz (`RouteComparisonProvider.getComparison(request): Promise<RouteComparisonResult>`) + `MockRouteComparisonProvider` (iki sabit/deterministik mock rota — ör. şehir çiftine göre hafifçe farklılaştırılmış iki sahte polyline) + `GoogleRouteComparisonProvider` (Routes API'ye iki paralel `computeRoutes` çağrısı yapar: biri `avoidTolls:false`, biri `true`).
- **`compareRoutes.ts`** (orchestrator), her iki rotanın mesafe/süresini alır, önce `lib/tolls/tollTariffService.ts`'e şehir çiftinin kürasyonlu tabloda olup olmadığını sorar; varsa oradaki resmi HGS tutarını, yoksa mevcut mesafe-bazlı tahmini kullanır ve **her biri için ayrı ayrı** mevcut `calculateTrip`'i çağırır (`avoidTolls` alanını Sprint 15'te zaten eklenen `TripCalculationInput.avoidTolls` ile besleyerek) ve şu çıktıyı üretir: `{ fastestRoute: RouteWithCost, noTollRoute: RouteWithCost, difference: { costDelta, durationDeltaMinutes }, comment: string }`. `calculateTrip`, `calculateFuelCost` — **hiçbiri değişmez**; `calculateMockTollCost` yalnızca kürasyonlu tabloda eşleşme yoksa devreye giren bir **fallback** olarak kalır (birincil kaynak değil). `comment` alanı ("Otoyolları kullanmazsan 770 TL tasarruf edebilirsin...") saf bir string-template fonksiyonuyla üretilir, UI'da hardcode edilmez.
- **`app/api/route-comparison/route.ts`**, Sprint 15'te kurulan `app/api/distance/route.ts` sunucu-tarafı deseninin birebir tekrarıdır — aynı gerekçeyle (client component `GOOGLE_MAPS_API_KEY`'i okuyamaz) mesafe/rota çağrısı sunucuda kalmalıdır. İki route'un ortak bir yardımcı fonksiyona (`resolveMapsProviderMode()` gibi) çıkarılması, ileride bir refactor fırsatı olarak not düşülür (bu doküman kapsamında zorunlu değil).
- **Harita render katmanı** (`RouteComparisonMap.tsx`) yeni bir bağımlılık gerektirir: statik bir görsel (Static Maps API + üzerine çizilmiş polyline) mi, yoksa etkileşimli bir JS haritası (Maps JavaScript API, `@vis.gl/react-google-maps` gibi bir React sarmalayıcı) mı kullanılacağı, Bölüm 5'teki UI önerisiyle birlikte ele alınır.

---

## 5. UI Önerisi

### 5.1 Desktop

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Seyahat Bütçen Hazır — İstanbul → Antalya                                │
├───────────────────────────────────────┬───────────────────────────────────┤
│                                        │  🔵 Otoyollu Rota   [Bu Rotayı Seç]│
│                                        │  📍 698 km   ⏱️ 8 saat            │
│         HARİTA (60%)                  │  ⛽ Yakıt: 1.240 TL                │
│   ── mavi çizgi: Otoyollu Rota        │  🛣️ HGS: 349 TL                   │
│   ┄┄ yeşil kesikli: Otoyolsuz Rota    │  💰 Toplam: 28.450 TL              │
│                                        ├───────────────────────────────────┤
│   [🔵 Otoyollu] [🟢 Otoyolsuz]        │  🟢 Otoyolsuz Rota   [Bu Rotayı Seç]│
│   (üstte rota vurgulama toggle'ı)     │  📍 742 km   ⏱️ 9 saat            │
│                                        │  ⛽ Yakıt: 1.330 TL                │
│                                        │  🛣️ HGS: 0 TL                     │
│                                        │  💰 Toplam: 27.680 TL              │
│                                        ├───────────────────────────────────┤
│                                        │  💬 Rotaly Yorumu                  │
│                                        │  "Otoyolları kullanmazsan 770 TL   │
│                                        │  tasarruf edebilirsin. Yolculuğun  │
│                                        │  yaklaşık 1 saat uzar."            │
└───────────────────────────────────────┴───────────────────────────────────┘
```

- Harita solda/geniş (yaklaşık %60 genişlik), iki rota her zaman **aynı anda** çizili; kullanıcı üstteki küçük toggle ile birini "aktif/vurgulu" hale getirebilir (diğeri soluk kalır) ama hiçbiri haritadan tamamen kaybolmaz — kıyaslama hep görünür kalır.
- Sağda dikey iki rota kartı (mevcut `TripResultSummary`'nin kalem kırılımı stiliyle tutarlı — aynı `rounded-2xl bg-slate-800` dil) + altta "Rotaly Yorumu" kutusu (mevcut bilgi kutusu stiliyle aynı, `bg-slate-800/60 border border-slate-700`).
- "Bu Rotayı Seç" butonuna tıklanan kart vurgulanır (mavi kenarlık), toplam bütçe o rotaya kilitlenir; kullanıcı fikrini değiştirip diğer kartı seçebilir (state anlık günceller, yeni bir API çağrısı gerekmez — iki rota zaten önceden yüklenmiştir).

### 5.2 Mobil

```
┌───────────────────────────┐
│  Seyahat Bütçen Hazır      │
│  İstanbul → Antalya        │
├───────────────────────────┤
│   [🔵 Otoyollu] [🟢 Otoyolsuz]  ← sekme/segment kontrolü
│                             │
│      HARİTA (~35-40%)      │
│   yalnızca seçili sekmenin │
│   rotası tam opaklıkla,    │
│   diğeri ince/soluk çizgi  │
├───────────────────────────┤
│  🔵 Otoyollu Rota           │
│  📍698 km ⏱️8 saat 💰28.450TL│
│         [Bu Rotayı Seç]    │
├───────────────────────────┤
│  🟢 Otoyolsuz Rota          │
│  📍742 km ⏱️9 saat 💰27.680TL│
│         [Bu Rotayı Seç]    │
├───────────────────────────┤
│  💬 "Otoyolları kullanmazsan│
│  770 TL tasarruf edebilir- │
│  sin. ~1 saat uzar."       │
└───────────────────────────┘
```

- Küçük ekranda iki tam-opak polyline'ı üst üste okumak zordur; bu yüzden mobilde **sekme/segment kontrolü** öne çıkar — aktif sekmenin rotası net, diğeri ince/soluk bir referans çizgisi olarak kalır (tamamen kaybolmaz, "diğer seçenek de var" hissi korunur).
- Harita yüksekliği kısıtlı (~%35-40 viewport) tutulur, geri kalan alan dikey kaydırmalı kart listesine ayrılır — mevcut calculator akışının tek-sütun, büyük dokunma alanlı (mevcut `p-6`/`py-4` buton boyutları) mobil dilini korur.
- "Bu Rotayı Seç" butonu her kartın içinde, sticky/sabit değil — mevcut sonuç ekranı buton düzenine (alt alta, geniş dokunma alanı) tutarlı.

### 5.3 Harita bileşeni — açık teknik soru

Etkileşimli bir JS haritası (Maps JavaScript API) mı, statik bir görsel (Static Maps API üzerine sunucu tarafında çizilmiş polyline) mı kullanılacağı, bu dokümanın kapsamı dışında bırakılan bir uygulama detayıdır; ancak PM/mimari not olarak: statik görsel daha ucuz ve basittir (yakınlaştırma/kaydırma yoktur) ama "Google Maps benzeri" beklentisini tam karşılamaz; etkileşimli harita beklenen deneyime daha yakındır ama ek bir JS bağımlılığı ve **ayrı bir "Maps JavaScript API" faturalama SKU'su** getirir (bu doküman Bölüm 3'te tartışılan Routes API'den farklı bir ürün/fiyatlandırmadır). Bu seçim, geliştirme öncesi ayrı bir teknik karar olarak netleştirilmelidir.

---

## 6. V1 / V2 / V3 Yerleşimi

**Öneri: V2, Sprint 6'nın (Rota Tercihi) hemen ardından.**

Gerekçe:

1. **Bağımlılık zinciri:** Bu özellik, gerçek Google Maps entegrasyonunu (Sprint 5) ve idealde Rota Tercihi kavramının (Sprint 6) ürün içinde zaten var olmasını gerektirir — mock/varsayım tabanlı bir haritada "gerçek rota" göstermek tutarsız ve yanıltıcı olur (PRD'nin "tahmini vs gerçek" ilkesine aykırı). V1'in "dış canlı veri kaynağına bağımlı olmama" ilkesi (PRD Bölüm 4) bu özelliği doğrudan V1 dışına iter.
2. **Yeni maliyetli bağımlılık:** Routes API (kademeli fiyatlandırma) ve bir harita render bileşeni (JS Maps API ya da Static Maps), V1'in "hiçbir üçüncü parti canlı veri kaynağına bağımlı değildir" ilkesiyle doğrudan çelişir; bu tür yatırımlar bilinçli olarak V2'ye bırakılmıştır.
3. **V3'teki Karşılaştırma Ekranı'yla karıştırılmamalı:** V3'ün Karşılaştırma Ekranı, ulaşım **tipleri arası** (araba/uçak/otobüs/tren) bir kıyaslamadır ve Tren Uygunluk Motoru/otel pilotu gibi V2'nin sonlarına kadar tamamlanmayan bağımlılıklara ihtiyaç duyar (Sprint 9-10). Akıllı Rota Karşılaştırması ise yalnızca **araç içi** iki senaryo (otoyollu/otoyolsuz) kıyaslar ve yalnızca Sprint 5-6'nın tamamlanmasına bağımlıdır — bu, onu V3'ün sonuna değil, V2'nin ortasına/sonrasına yerleştirmeyi teknik olarak mümkün ve gerekçeli kılar.
4. **Ürün değeri zamanlaması:** Bu özellik, hem güçlü bir demo/pazarlama materyali (haritalı, görsel, "Google Maps'ten daha akıllı" hissi veren) hem de Rota Tercihi'nin (Sprint 6) soyut 3 seçeneğini somut hâle getiren bir tamamlayıcıdır. V3'ün sonuna (Sprint 10+) ertelemek, bu görsel farklılaştırıcıyı gereksiz yere geciktirir.

**Alternatif görüş (şeffaflık için not düşülüyor):** Bu özellik, görsel/"wow" etkisi ve karar-destek vizyonuyla doğrudan örtüştüğü için V3'ün Karşılaştırma Ekranı'yla birlikte, "premium görsel katman" olarak paketlenmesi de savunulabilir. Ancak bu, teknik bağımlılık zincirini (yalnızca Sprint 5-6'ya ihtiyacı var, Sprint 9-10'a değil) göz ardı eder ve değeri gereksiz geciktirir — bu yüzden birincil öneri V2'dir.

**Önerilen sprint numarası:** Mevcut Sprint 6 (Rota Tercihi) ile Sprint 7 (Gerçek Yakıt/HGS Fiyatları) arasına eklenen yeni bir **Sprint 6.5 — Akıllı Rota Karşılaştırması** olarak planlanabilir; bu, PRD'nin Sprint 7+ numaralarının kaymasını gerektirir (dokümantasyon güncellemesi, bu doküman kapsamında değil, ayrı bir PRD revizyonu gerektirir).

---

## 7. Rakiplerden Ayrışma Analizi (Ürün Yöneticisi Bakış Açısı)

**Rekabet ortamı üç kümede toplanır, hiçbiri bu üçünü birden yapmıyor:**

1. **Navigasyon uygulamaları (Google Maps, Yandex Navigation, Waze):** Rota gösterir, süre/mesafe verir, hatta otoyol kaçınma seçeneği sunar — ama **hiçbiri kullanıcının kendi aracına özgü yakıt tüketimini, HGS'yi ve toplam seyahat bütçesini** (konaklama/yemek/aktivite dahil) hesaba katmaz. Rota var, bütçe yok.
2. **Yakıt/masraf hesaplayıcılar (çeşitli "yakıt hesaplama" web/mobil araçları):** Mesafe × tüketim × fiyat hesaplar — ama **rota göstermez, tek bir senaryo sunar, otoyollu/otoyolsuz farkını görselleştirmez.** Bütçe var, rota yok, karşılaştırma yok.
3. **Bilet/rezervasyon platformları (Enuygun, Biletbayi, Skyscanner vb.):** Bilet fiyatı karşılaştırır — ama **kendi aracıyla gidenler için hiçbir şey sunmaz**, senaryo bazlı bir "araçla gitsem mi" analizi yapmaz.

**Akıllı Rota Karşılaştırması, bu üç kümenin kesişiminde, hiçbirinin tek başına sunmadığı bir deneyim yaratır:** aracına özgü yakıt modeli + gerçek rota geometrisi + iki senaryonun yan yana, haritalı, doğal dilde yorumlanmış kıyaslaması. Bunu taklit etmek rakipler için ucuz değildir — hem bir araç/yakıt veri modeli (Rotaly'nin zaten sahip olduğu araç kataloğu + Fuel Price Service mimarisi) hem harita/rota entegrasyonu hem de bunları tek bir "karar anı"nda birleştiren bir orkestrasyon katmanı gerektirir. Rotaly bu üçünü PRD'nin V1'den beri kurduğu mimari (Provider deseni, `calculateTrip` orchestrator, Fuel Price Service) sayesinde **zaten** üretim hattında hazır bulunduruyor; rakiplerin bunu yakalaması, sıfırdan bir domain modeli kurmalarını gerektirir.

**İkincil etki — paylaşılabilirlik ve büyüme:** "Otoyolları kullanmazsan 770 TL tasarruf edebilirsin" gibi somut, kişiselleştirilmiş bir cümle, ekran görüntüsü alınıp paylaşılabilecek, organik büyümeyi destekleyecek türde bir içeriktir (bkz. `docs/product-design-proposals.md`'deki "Paylaşılabilir Sonuç Sayfası" fikriyle doğal bir sinerji). Bu, özelliğin yalnızca bir UX iyileştirmesi değil, aynı zamanda bir **pazarlama/edinim (acquisition) aracı** olarak da değerlendirilmesi gerektiği anlamına gelir.

**Risk/sınır (dürüstlük için not):** Bu farklılaşma sürdürülebilir olması için Google'ın kendi rota/toll verisiyle **tutarlı** kalınmalı — eğer Rotaly'nin gösterdiği mesafe/süre gerçek Google rotasından belirgin şekilde saparsa (ör. mock aşamasında), güven kaybı riski Bölüm 3.5'teki doğrulama adımıyla erken ele alınmalıdır.
