# Rotaly — Ürün Gereksinim Dokümanı (PRD)

**Doküman sahibi:** Product Management
**Durum:** v1.0 — Onaylanmış Yol Haritası
**Önceki sürüm:** v0.1 (Taslak)
**Kapsam:** Rotaly Akıllı Seyahat Bütçe Planlama Platformu

**v1.0 sürüm notları (v0.1 → v1.0):**

- Vizyon, salt "maliyet hesaplama" çerçevesinden "doğru ulaşım kararı" çerçevesine genişletildi.
- Araçla seyahatte Otoyol Tercihi resmi bir akış adımı oldu.
- Statik yakıt fiyatları yerine adı konmuş bir **Fuel Price Service** roadmap'e girdi.
- Elektrikli araç şarj maliyeti için menzil/şarj sayısı/AC-DC ayrımını içeren gelişmiş bir model tanımlandı (V2).
- Konaklama artık tek tip değil; kullanıcı Konaklama Tipi seçecek.
- Tren için ayrı bir **Tren Uygunluk Motoru** tanımlandı ve bilet fiyatlandırmasından önce, V2'ye çekildi.
- Yeni V3 marka özelliği: ulaşım tipleri arası **Karşılaştırma Ekranı**.
- Rota Tercihi (En Hızlı / En Ekonomik / Dengeli) roadmap'e eklendi.
- Sona **Teknik Mimari** bölümü eklendi; Sprint planı Sprint 1–10 olarak yeniden yazıldı.

---

## Vizyon (v1.0)

> **"Rotaly, kullanıcıların seyahat öncesinde en doğru ulaşım kararını verebilmesini sağlayan akıllı seyahat bütçe planlama platformudur."**

v0.1'de Rotaly'yi "seyahat maliyetini tahmin eden uygulama" olarak tanımlamıştık. Bu doğru ama eksikti: bir kullanıcı için asıl değerli olan tek bir sayı değil, **"hangi seçenek benim için daha mantıklı?"** sorusunun cevabıdır. v1.0 ile birlikte Rotaly, maliyeti kalemlere ayıran bir hesap makinesinden, ulaşım tiplerini (araç/uçak/otobüs/tren) yan yana koyup karar vermeyi kolaylaştıran bir **karar destek platformuna** evriliyor. Bu vizyonun en somut karşılığı, V3'te devreye girecek olan Karşılaştırma Ekranı'dır (bkz. Bölüm 6 ve 8); ancak bu vizyon V1'den itibaren her ürün kararına (otoyol tercihi, konaklama tipi, rota tercihi) yön verir — çünkü her biri kullanıcıya "senin durumun için en doğru seçenek hangisi" sorusuna daha yakın bir cevap verdirir.

---

## 1. Ürün Amacı

Rotaly'nin amacı, bir kullanıcının "bu seyahat bana gerçekte ne kadara mal olacak, ve hangi ulaşım seçeneği benim için en mantıklısı?" sorusuna, seyahate çıkmadan önce, tek bir akışta ve birkaç dakika içinde güvenilir bir yanıt vermektir.

Bunu şu şekilde yapar:

- Ulaşım tipinden bağımsız olarak (kendi aracı, uçak, otobüs, tren) toplam maliyeti tahmin eder.
- Maliyeti tek bir sayıya indirgemek yerine kalemlere ayırarak şeffaf gösterir (yakıt, otoyol, konaklama, yemek, aktivite).
- Kullanıcının tercihlerine (otoyol kullan/kullanma, konaklama tipi, rota tercihi) duyarlı, kişiselleştirilmiş bir tahmin üretir.
- Zamanla mock/varsayım verilerden gerçek, canlı veri kaynaklarına geçecek şekilde tasarlanmıştır; kullanıcı her zaman hangi verinin tahmini, hangisinin gerçek olduğunu bilir.
- Karar vermeyi doğrudan destekler: ulaşım tiplerini yan yana karşılaştırarak "kendi arabamla mı gitsem, uçsam mı?" sorusuna sayısal bir cevap verir (V3 Karşılaştırma Ekranı).

Rotaly bir rezervasyon/satış platformu değildir; birincil değeri **bütçe şeffaflığı ve karar desteğidir**, işlem (satın alma) değildir.

## 2. Hedef Kullanıcılar

| Persona | Tanım | İhtiyaç |
|---|---|---|
| Bireysel gezgin | Hafta sonu/tatil için yurtiçi seyahat planlayan kullanıcı | Hızlı, güvenilir toplam bütçe tahmini |
| Bütçe bilinçli aile | 2-4 kişilik aile, çoklu gün/kişi hesaplaması yapan kullanıcı | Kişi × gün bazlı detaylı kalem kırılımı, konaklama tipine göre esneklik |
| Kendi aracıyla gidenler | Yakıt/HGS maliyetine duyarlı sürücüler | Araç bazlı gerçekçi yakıt tüketimi, otoyol tercihi |
| Elektrikli araç sahipleri | EV kullanan, şarj maliyeti ve süresi planlaması gereken kullanıcılar | Menzil/şarj sayısı/süresi dahil gerçekçi şarj maliyeti tahmini |
| Ulaşım karşılaştırması yapanlar | "Araçla mı, uçakla mı, otobüsle mi?" kararı veren kullanıcılar | Karşılaştırma Ekranı ile ulaşım tipleri arası doğrudan kıyaslama (V3) |
| İçerik üreticileri / seyahat blogcuları | Takipçilerine bütçe referansı sunmak isteyenler | Paylaşılabilir/görsel sonuç ekranı, PDF export |

## 3. Ana Problem

Kullanıcılar seyahat öncesi gerçek maliyeti güvenilir şekilde tahmin edemiyor ve doğru ulaşım kararını veremiyor çünkü:

1. **Maliyet kalemleri dağınık:** Yakıt, HGS, otel, bilet, yemek gibi kalemler farklı uygulama/sitede ayrı ayrı hesaplanıyor.
2. **Ulaşım tipine göre maliyet yapısı kökten değişiyor:** Araçla gitmek yakıt+HGS gerektirirken, uçakla gitmek bilet fiyatına, otobüs/tren ise bilet+sefer uygunluğuna bağlı.
3. **Manuel hesaplama zaman alıyor ve hataya açık:** Kullanıcı genelde kaba bir tahmin yapıp yola çıkıyor, sonda bütçe aşımı yaşıyor.
4. **Fiyatlar dinamik:** Yakıt fiyatı, bilet fiyatı, otel fiyatı gün gün değişebiliyor; statik bir tahmin hızla güncelliğini yitiriyor.
5. **Araç ve tercih bazlı farklılık göz ardı ediliyor:** Aynı mesafe için farklı araçlar (dizel/benzinli/hibrit/elektrikli), farklı konaklama tipleri (otel/kamp/apart) ve farklı rota tercihleri (hızlı/ekonomik) çok farklı maliyet üretiyor, ama çoğu araç bu farkları hesaba katmıyor.
6. **Elektrikli araç kullanıcıları için özel bir araç yok:** Şarj maliyeti ve süresi hesaplama ihtiyacı büyüyor ama yaygın, kolay kullanılan bir çözüm bulunmuyor.
7. **Ulaşım tipleri arası objektif bir karşılaştırma yok:** Kullanıcı "araçla mı, uçakla mı daha mantıklı" sorusunu cevaplamak için ayrı ayrı hesaplama yapıp kendi kendine kıyaslamak zorunda kalıyor.

## 4. V1 Kapsamı

V1, Rotaly'nin **tahmini (mock/varsayım tabanlı) ama mimari olarak gerçek veriye hazır** ilk sürümüdür. Amaç, uçtan uca çalışan bir demo/MVP ile ürün-pazar uyumunu test etmektir; hiçbir üçüncü parti canlı veri kaynağına bağımlı değildir. V1'e giren tüm yeni maddeler, **dış veri/API gerektirmeden** (yalnızca yeni bir adım + daha zengin bir mock formülüyle) uygulanabilir olduğu için seçildi — bu, "önce çalışan ürün" ilkesinin doğrudan uygulanmasıdır.

**V1'de bulunanlar (mevcut + tamamlanacak):**

- Şehir seçimi (81 il, yazdıkça filtreleme ile arama).
- Ulaşım tipi seçimi: Kendi Aracım / Uçak / Otobüs / Tren.
- Araç kataloğu: marka → model seçimi (benzinli, dizel, hibrit, elektrikli; en az 40 model).
- Yakıt hesaplama motoru: seçilen araca (veya varsayılana) göre tüketim × mesafe × birim fiyat.
- Trip calculation motoru: yakıt + otoyol (HGS) + konaklama + yemek + aktivite kalemlerini tek bir toplamda birleştirir.
- Mock mesafe servisi: şehir çiftine göre deterministik mesafe/süre üretir; gerçek Google Maps entegrasyonuna hazır arayüz (`MapsProvider`) üzerinden çalışır.
- Sonuç ekranı: mesafe, ulaşım tipi, araç bilgisi kartları + kalem bazlı maliyet dökümü + toplam bütçe + "tahmini veri" bilgilendirmesi.
- Landing page: ürün vizyonunu anlatan, CTA'lı tanıtım sayfası.
- **Yeni — Otoyol Tercihi adımı (Sprint 1):** "Kendi Aracım" seçen kullanıcıya "Otoyolları Kullan" / "Otoyollardan Kaçın" seçeneği sunulur. Mock aşamada: kullanılmazsa HGS kalemi sıfırlanır, mesafe/süre mock bir katsayıyla uzatılır.
- **Yeni — Fuel Price Service (Sprint 2):** Yakıt/elektrik birim fiyatları artık adı konmuş, tek bir servis (`FuelPriceService`) üzerinden okunur. V1'de bu servisin implementasyonu elle güncellenebilir bir config'tir (canlı veri değildir), ama arayüz canlı veri sağlayıcısına geçişe hazırdır.
- **Yeni — Konaklama Tipi seçimi (Sprint 3):** Kullanıcı Otel / Apart / Bungalov / Kamp / Arkadaşta Kalacağım seçeneklerinden birini seçer; her tip farklı bir mock maliyet çarpanı kullanır.
- Tüm sonuç ekranında **"Bu hesaplama tahmini değerler kullanılarak oluşturulmuştur"** uyarısı ve her kalemde tutarlı "tahmini" etiketleme (Sprint 4); V1'de hiçbir kalem gerçek zamanlı veri kullanmaz.
- Temel analytics event'leri (adım bazlı akış ölçümü) — dış veri kaynağı gerektirmediği için V1 kapsamına alındı (Sprint 4).

**V1 çıkış kriteri:** Kullanıcı, herhangi bir hesap oluşturmadan, uçtan uca (şehir → ulaşım → araç → otoyol tercihi → konaklama tipi → kişi/gün → sonuç) kişiselleştirilmiş bir bütçe tahmini alabilmeli ve bu tahminin "tahmini" olduğunu net şekilde görmelidir.

## 5. V2 Kapsamı

V2'nin teması: **mock veriden gerçek veriye geçiş**, rota zekâsının derinleşmesi ve temel bilet/konaklama entegrasyonlarının başlaması.

- Google Maps Distance Matrix API canlı entegrasyonu (`GoogleMapsProvider` aktivasyonu; mimari V1'de zaten hazır) ve Otoyol Tercihi'nin gerçek veriyle (Maps `avoid: tolls` parametresi) çalışması (Sprint 5).
- **Rota Tercihi:** Kullanıcının En Hızlı / En Ekonomik / Dengeli seçeneklerinden birini seçebilmesi; bu seçim hem Google Maps'ten alınan rota alternatiflerini hem Trip Calculator'ın hangi senaryoyu kullanacağını belirler (Sprint 6). Bu özellik teknik olarak Sprint 5'teki canlı Maps entegrasyonuna bağımlıdır.
- **Fuel Price Service'in canlı veri sağlayıcısına bağlanması:** Benzin, motorin, LPG ve elektrik (kWh) fiyatlarının şehir bazlı, güncel bir kaynaktan sağlanması; aynı sprint içinde HGS için de güncel tarife tablosuna geçiş (Sprint 7).
- **Elektrikli araç gelişmiş şarj modeli:** Tahmini menzil, seyahat için gereken şarj sayısı, AC (yavaş) / DC (hızlı) şarj ayrımı, tahmini şarj süresi ve toplam şarj maliyetini birlikte hesaplayan model (Sprint 8).
- Temel kullanıcı hesabı: geçmiş hesaplamaları kaydetme/görüntüleme (kayıt zorunlu değil, misafir kullanım da desteklenir) (Sprint 8, EV modeliyle paralel yürütülebilir).
- **Tren Uygunluk Motoru:** Seçilen şehir çifti için tren seferi olup olmadığının statik/curated bir veri setiyle doğrulanması; sefer yoksa UI'da net bir uyarı gösterilmesi (Sprint 9).
- Otobüs bileti için temel entegrasyon (sınırlı sayıda partner/route ile pilot) (Sprint 9).
- Konaklama için ilk gerçek fiyat denemesi: yalnızca "Otel" tipi için, tek bir otel/OTA API'siyle sınırlı şehir kapsamında pilot entegrasyon (tam kapsam ve diğer konaklama tipleri V3'te) (Sprint 9).
- PDF export: sonuç ekranının PDF olarak indirilebilmesi (V1'de arayüzde "Yakında" rozetiyle yer tutucu olarak duruyor) (Sprint 9).

## 6. V3 Kapsamı

V3'ün teması: **tam bilet/konaklama entegrasyonu ve vizyonun en somut hâli olan Karşılaştırma Ekranı**.

- **Karşılaştırma Ekranı (yeni marka özellik):** Sonuç ekranında Araba / Uçak / Otobüs / Tren seçeneklerinin toplam tahmini maliyetlerinin yan yana gösterilmesi (bkz. Bölüm 8'deki örnek). Tren için Tren Uygunluk Motoru "uygun değil" derse, ilgili hücrede "Bu rota için uygun değil" gösterilir. Bu ekran, her ulaşım tipi için paralel `calculateTrip` çağrıları yaparak çalışır ve Rotaly'nin "en doğru ulaşım kararı" vizyonunun doğrudan karşılığıdır (Sprint 10).
- Uçak bileti gerçek zamanlı fiyat entegrasyonu (GDS/acente API'leri: ör. Amadeus, Skyscanner, yerli acente API'leri).
- Tren bileti gerçek zamanlı fiyat entegrasyonu (Tren Uygunluk Motoru V2'de geldi; burada uygunluğu onaylanan seferler için gerçek fiyatlandırma eklenir).
- Otel/konaklama için tam kapsamlı gerçek fiyat entegrasyonu — tüm konaklama tipleri (Apart, Bungalov, Kamp dahil) ve tüm şehirler için (V2'de yalnızca "Otel" tipi, sınırlı şehir kapsamındaydı).
- Çok duraklı rota planlama (A → B → C gibi çoklu şehir rotaları).
- AI destekli seyahat asistanı: bütçeyi düşürecek alternatif öneriler ("otobüsle gitsen %40 daha ucuza gelir" gibi) — Karşılaştırma Ekranı'nın doğal devamı.
- Kullanıcı/topluluk verisiyle tahmin kalibrasyonu: gerçek kullanıcı harcamalarının (opsiyonel, anonim) toplanarak mock formüllerin gerçek verilerle iyileştirilmesi.
- Çoklu para birimi desteği (yurt dışı seyahat senaryoları).

## 7. V1'de Kesinlikle Olmayacak Özellikler

Beklenti yönetimi için V1 kapsamı dışında bırakılan, üzerinde çalışılmayacak maddeler:

- Gerçek zamanlı uçak/otobüs/tren bileti fiyatlandırması veya satın alma.
- Gerçek otel fiyatları, müsaitlik veya rezervasyon akışı (V1'de tüm konaklama tipleri mock çarpanla hesaplanır).
- Kullanıcı hesabı, giriş/kayıt, kayıtlı seyahat geçmişi.
- Herhangi bir ödeme/satın alma akışı (Rotaly V1'de para hareketi içermez).
- PDF/rapor export (arayüzde yer tutucu olarak durur, işlevsel değildir).
- Çoklu para birimi / yurt dışı seyahat desteği.
- Canlı/gerçek zamanlı yakıt veya elektrik fiyatı API entegrasyonu (Fuel Price Service V1'de yalnızca config tabanlıdır).
- Elektrikli araç şarj istasyonu haritası, gerçek zamanlı doluluk bilgisi veya gelişmiş şarj modeli (menzil/AC-DC ayrımı V2 hedefidir; V1'de basit kWh × fiyat formülü kullanılmaya devam eder).
- Rota Tercihi (En Hızlı/En Ekonomik/Dengeli) — V1'de tek senaryo (varsayılan rota) kullanılır, alternatif rota sorgusu yoktur.
- Ulaşım tipleri arası Karşılaştırma Ekranı — V1 ve V2'de yoktur, yalnızca V3'te gelir.
- Çok duraklı/çoklu şehir rota planlama.
- Native mobil uygulama (yalnızca responsive web).
- Tren/otobüs sefer uygunluğu kontrolü (V1'de tüm ulaşım tipleri her rotada seçilebilir; Tren Uygunluk Motoru V2'de gelir).

## 8. Kullanıcı Akışı

```
Ana Sayfa (Landing)
   │  "Hesaplamaya Başla" CTA
   ▼
Adım 1 — Nereden çıkıyorsunuz?      (81 il, arama kutusu ile filtrelenebilir)
   ▼
Adım 2 — Nereye gidiyorsunuz?       (başlangıç ile aynı şehir seçilemez)
   ▼
Adım 3 — Nasıl gideceksiniz?        (Kendi Aracım / Uçak / Otobüs / Tren)
   │
   ├─ "Kendi Aracım" seçildiyse ──▶ Adım 4 — Aracınızı seçin (marka → model)
   │                                        │
   │                                        ▼
   │                              Adım 5 — Otoyol Tercihi (Otoyolları Kullan / Otoyollardan Kaçın)
   │                                        │
   └─ diğer ulaşım tipleri ────────────────▶ (Adım 4 ve 5 tamamen atlanır)
   ▼
Adım 6 — Konaklama Tipi              (Otel / Apart / Bungalov / Kamp / Arkadaşta Kalacağım)
   ▼
Adım 7 — Kaç kişisiniz?
   ▼
Adım 8 — Kaç gün kalacaksınız?
   ▼
Sonuç Ekranı
   │
   ├─ Mesafe hesaplanıyor... (loading)
   ├─ Hata: "Mesafe hesaplanamadı" + Tekrar Dene
   └─ Başarılı:
        ├─ Başlık: "Seyahat Bütçen Hazır" + Şehir → Şehir
        ├─ Bilgi kartları: Mesafe · Ulaşım · Araç (seçildiyse) · Konaklama Tipi
        ├─ Maliyet kartı: Yakıt · Otoyol · Konaklama · Yemek · Aktivite · TOPLAM
        ├─ Bilgilendirme kutusu: "tahmini değerlerle oluşturulmuştur"
        └─ Butonlar: ← Yeni Hesaplama · PDF (Yakında, pasif)
```

**Önemli akış kuralları:**

- İlerleme çubuğu (ProgressBar) ulaşım tipine göre dinamiktir: "Kendi Aracım" seçilirse Araç ve Otoyol Tercihi adımları dahil 9 adım, diğer ulaşım tiplerinde bu iki adım atlanarak 7 adım gösterilir.
- Geri gidildiğinde ve başlangıç şehri değiştirildiğinde, hedef şehir ve mesafe verisi geçersiz kılınıp yeniden istenir (tutarsız şehir çifti gösterilmez).
- Ulaşım tipi "Kendi Aracım" dışında bir şeye çevrilirse araç ve otoyol tercihi seçimleri sıfırlanır, yakıt ve otoyol kalemleri sonuç ekranında "hesaplanmadı" olarak gösterilir.
- Otoyol Tercihi ve Konaklama Tipi seçimleri sonuç ekranındaki ilgili maliyet kalemlerini (sırasıyla Otoyol ve Konaklama) doğrudan etkiler.

### Gelecek Akış Uzantısı (V3): Karşılaştırma Ekranı

Sonuç ekranına, mevcut akışı bozmayan **isteğe bağlı bir ikinci görünüm** olarak eklenecektir. Örnek çıktı:

| Ulaşım Tipi | Tahmini Toplam Maliyet |
|---|---|
| 🚗 Araba | 28.500 TL |
| ✈️ Uçak | 31.200 TL |
| 🚌 Otobüs | 18.900 TL |
| 🚆 Tren | Bu rota için uygun değil |

Bu görünüm, aynı şehir çifti ve seyahat parametreleri (kişi/gün) için her ulaşım tipine `calculateTrip` çağrısı paralel olarak yapılarak üretilir. Tren satırı, Tren Uygunluk Motoru rotayı desteklemiyor derse otomatik olarak "Bu rota için uygun değil" metnine döner; bu sayede kullanıcıya var olmayan bir seçenek asla sayısal bir rakamla gösterilmez.

## 9. Hesaplama Kalemleri

| # | Kalem | V1 Hesaplama Yöntemi | V1 Kapsamı | Hedef Faz |
|---|---|---|---|---|
| 1 | Yakıt | Mesafe × 100km başına tüketim × Fuel Price Service'ten alınan birim fiyat (araca özgü ya da varsayılan) | Yalnızca "Kendi Aracım" seçiliyse hesaplanır | V2: Fuel Price Service canlı veri (Sprint 7) |
| 2 | Otoyol (HGS) | Mesafe × sabit km ücreti (mock); Otoyol Tercihi "kaçın" ise kalem sıfırlanır, mesafe/süre mock katsayıyla uzar | Otoyol Tercihi adımındaki seçime göre hesaplanır (Sprint 1) | V2: gerçek HGS tarifesi + gerçek rota mesafe farkı (Sprint 5, 7) |
| 3 | Elektrikli şarj | Yakıt formülüyle aynı mantık; birim kWh, fiyat Fuel Price Service'ten (mock) | Elektrikli araç seçildiyse otomatik devreye girer | V2: menzil/şarj sayısı/AC-DC/süre dahil gelişmiş model (Sprint 8) |
| 4 | Tren uygunluğu | Kontrol edilmiyor; tren her rotada seçilebilir | Kapsam dışı | V2: Tren Uygunluk Motoru, statik veri seti (Sprint 9) |
| 5 | Uçak/Otobüs/Tren bileti | **Hesaplanmıyor** (ulaşım tipi seçilebilir ama bilet maliyeti modele dahil değil) | Kapsam dışı | V2: Otobüs pilot (Sprint 9) · V3: Uçak + Tren tam bilet fiyatlandırma |
| 6 | Konaklama | Kişi × gün × konaklama tipine özgü mock gecelik ücret (Otel/Apart/Bungalov/Kamp/Arkadaşta Kalacağım) | Konaklama Tipi adımındaki seçime göre hesaplanır (Sprint 3) | V2: yalnızca "Otel" tipi için gerçek fiyat pilotu (Sprint 9) · V3: tüm tipler, tam kapsam |
| 7 | Yemek | Kişi × gün × sabit günlük ücret (mock) | Her zaman hesaplanır | V2/V3: bölgeye göre kalibrasyon |
| 8 | Aktivite | Kişi × gün × sabit günlük ücret (mock) | Her zaman hesaplanır | V2/V3: bölgeye göre kalibrasyon |
| 9 | **Toplam Bütçe** | Yukarıdaki kalemlerin, seçilen Rota Tercihi'ne (V2+) göre belirlenen senaryo üzerinden toplamı | Her zaman gösterilir | Kalemler gerçekleştikçe otomatik iyileşir |

> Not: Uçak/otobüs/tren bileti maliyetinin toplam bütçeye dahil edilmemesi, V1'in en belirgin sınırlamasıdır ve sonuç ekranında bu ulaşım tipleri seçildiğinde kullanıcıya açıkça belirtilmelidir (bkz. Bölüm 7 ve 11). Tren uygunluğu ile tren bileti fiyatlandırması **bilinçli olarak iki ayrı roadmap maddesidir**: uygunluk kontrolü statik veriyle ucuza ve erken (V2) çözülebilirken, gerçek zamanlı fiyatlandırma bir GDS/acente entegrasyonu gerektirdiği için daha maliyetli ve geç (V3) planlanmıştır.

## 10. Veri Kaynakları

| Veri | V1 Kaynağı | Hedef Kaynak | Faz |
|---|---|---|---|
| Şehir listesi | Statik, uygulama içi (81 il) | Değişmeyecek — statik veri yeterli | V1 |
| Mesafe/süre | Mock servis (şehir çiftine göre deterministik sözde-mesafe) | Google Maps Distance Matrix API | V2 (Sprint 5) |
| Rota alternatifleri (Hızlı/Ekonomik/Dengeli) | Yok (tek senaryo) | Google Maps alternatif rota sorgusu | V2 (Sprint 6) |
| Araç kataloğu | Statik mock (40+ model, marka/model/yakıt tipi/tüketim/yıl) | Genişletilebilir/güncellenebilir araç veritabanı | V1 (genişleme) → V2 (üretici verisiyle doğrulama) |
| Yakıt/elektrik fiyatı | **Fuel Price Service** — config tabanlı provider (manuel güncellenebilir; benzin/motorin/LPG/elektrik) | **Fuel Price Service** — canlı veri sağlayıcısı, şehir bazlı | V2 (Sprint 7) |
| Otoyol (HGS) ücreti | Mesafe bazlı mock sabit | Güncel HGS tarife tablosu (KGM) | V2 (Sprint 7) |
| Tren hat/sefer uygunluk verisi | Yok | Statik/curated şehir-çifti tren hattı veri seti (TCDD referans) | V2 (Sprint 9) |
| Konaklama fiyatı | Mock sabit, konaklama tipine göre çarpan | Otel/OTA API'si (önce yalnızca "Otel" tipi, sınırlı şehir) | V2 pilot (Sprint 9) → V3 tam kapsam (tüm tipler + tüm şehirler) |
| Otobüs bileti | Yok | Partner/acente API'si | V2 (Sprint 9, pilot) |
| Uçak bileti | Yok | GDS/acente API'si | V3 |
| Tren bileti (fiyatlandırma) | Yok | TCDD/acente API'si | V3 |

## 11. Riskler

| Risk | Etki | Olasılık | Azaltım Stratejisi |
|---|---|---|---|
| Üçüncü parti API maliyeti/limitleri (Maps, uçuş, otel) | Yüksek — ölçeklenmeyi ve maliyeti doğrudan etkiler | Orta | Önbellekleme (caching), istek başına maliyet takibi, kademeli rollout |
| Fiyat verisinin güncelliğini yitirmesi (yakıt/bilet/otel) | Yüksek — kullanıcı güveni kaybı | Orta-Yüksek | Veri kaynağı güncelleme sıklığı SLA'sı, "son güncelleme" zaman damgası gösterimi |
| Fuel Price Service veri kalitesi/kapsamı | Orta — bazı şehirler için fiyat verisi eksik/güncel olmayabilir | Orta | Şehir bazlı veri yoksa ülke ortalamasına düşen (fallback) katman; kaynağın veri kapsamı erken doğrulanmalı |
| Tren rotası uygunsuzluğu | Orta — yanlış/eksik sonuç kullanıcıyı yanıltabilir | Düşük (V2 Sprint 9'dan itibaren Tren Uygunluk Motoru ile aktif kontrol edilir) | Statik veri setinin düzenli güncellenmesi; sefer eklenen/kaldırılan hatlar için periyodik gözden geçirme |
| Tahmini vs. gerçek veri karışıklığı | Yüksek — ürüne genel güven riski | Orta | Her kalemde açık "tahmini" etiketleme, veri gerçek hale geldikçe etiketin kaldırılması |
| Elektrikli araç şarj maliyeti aşırı basitleştirme | Orta — EV kullanıcıları için yanıltıcı olabilir | Orta (V1) → Düşük (V2'de menzil/AC-DC modeliyle) | V1'de "kaba tahmindir" notu; V2'de gelişmiş model (Sprint 8) |
| Otoyol Tercihi'nin mock senaryosu gerçek farkı yansıtmıyor | Orta — mesafe/süre/HGS tutarsızlığı | Orta (V1) → Düşük (V2) | V1'de açık varsayım notu; V2'de gerçek Maps `avoid: tolls` parametresiyle doğrulama (Sprint 5) |
| Rota Tercihi kullanıcı beklentisiyle uyuşmayabilir (ör. "ekonomik" çok daha uzun sürebilir) | Orta — kullanıcı şaşkınlığı, güven kaybı | Orta | Her rota seçeneğinde süre/mesafe farkının açıkça gösterilmesi, "X dk daha uzun ama Y TL daha ucuz" gibi karşılaştırmalı ifade |
| Konaklama tipi çarpanlarının gerçekçi olmaması (ör. kamp çok ucuz görünmesi) | Orta — beklenti yönetimi sorunu | Orta | Bölgesel/mevsimsel kalibrasyon notu; her tipte "tahmini" etiketi; V2 pilotunda gerçek veriyle karşılaştırma |
| Ölçeklenebilirlik (Karşılaştırma Ekranı'nda çoklu canlı API çağrısı aynı anda) | Orta — performans/gecikme riski | Düşük-Orta | Kademeli entegrasyon, provider arayüzü üzerinden zaman aşımı/geri düşme (fallback) mekanizması, paralel çağrıların önbelleklenmesi |
| Yasal/ticari kısıtlar (bilet/otel fiyatı gösterimi) | Orta — API sağlayıcı kullanım şartları ihlali riski | Düşük | Sözleşme/şartların erken incelenmesi, gösterim biçiminin (fiyat vs. tahmini aralık) netleştirilmesi |
| Kapsam genişlemesi (scope creep) | Orta — V1 teslim tarihini geciktirebilir | Orta | Bölüm 7'deki net "V1'de olmayacaklar" listesine sıkı bağlılık |

## 12. Önceliklendirilmiş Sprint Listesi

Sprintler 2 haftalık kabul edilmiştir. **Sprint 0**, mevcut kod tabanını (şehir/ulaşım/araç seçimi, yakıt motoru, trip calculator, mock mesafe servisi, sonuç ekranı, landing page) temsil eden, zaten tamamlanmış bir temel olarak listelenmiştir.

### Sprint 0 — *(Tamamlandı)* Temel Akış
- **Amaç:** Uçtan uca çalışan, tamamı mock bir MVP iskeleti kurmak.
- **Teknik hedef:** Şehir/ulaşım/araç seçimi, `calculateFuelCost`, `calculateTrip`, mock `MapsProvider`, sonuç ekranı bileşenleri.
- **Ürün hedefi:** Kullanıcı en azından tek bir senaryo için uçtan uca bir tahmin alabilsin.
- **Çıktı:** Çalışan uçtan uca demo.

### Sprint 1 — Otoyol Tercihi
- **Amaç:** Araçla seyahat eden kullanıcılara otoyol kullan/kullanma tercihi sunmak.
- **Teknik hedef:** Akışa yeni bir adım (`tollPreference: "use" | "avoid"`) eklenir; `calculateTrip` bu değeri alır, mock senaryo olarak "avoid" seçilirse HGS kalemini sıfırlar ve mesafe/süreyi sabit bir katsayıyla uzatır.
- **Ürün hedefi:** Kullanıcı araçla giderken otoyol kullanıp kullanmayacağını seçebilir ve bu seçim sonuç ekranına yansır.
- **Çıktı:** Otoyol Tercihi adımı + güncellenmiş HGS/mesafe mock mantığı canlıda.

### Sprint 2 — Fuel Price Service (Config Katmanı)
- **Amaç:** Statik sabit yakıt fiyatlarını merkezi, güncellenebilir bir servis katmanına taşımak.
- **Teknik hedef:** `FuelPriceService` arayüzü + `ConfigFuelPriceProvider` (V1: elle güncellenen merkezi config) implementasyonu; `calculateFuelCost`'un fiyatı sabit yerine bu servisten okuması.
- **Ürün hedefi:** Fiyatlar kod değişikliği/deploy gerektirmeden, tek bir yerden güncellenebilir hale gelir.
- **Çıktı:** `FuelPriceService` arayüzü + config tabanlı provider + entegrasyon.

### Sprint 3 — Konaklama Tipi Seçimi
- **Amaç:** Kullanıcının konaklama tipini seçebilmesi ve her tipin farklı mock maliyet modeli kullanması.
- **Teknik hedef:** Yeni akış adımı + `accommodationType` alanı `TripCalculationInput`'a eklenir; konaklama maliyet fonksiyonu tipe göre çarpan uygular (Otel > Apart > Bungalov > Kamp/Arkadaşta Kalacağım).
- **Ürün hedefi:** Bütçe tahmini artık kullanıcının gerçek konaklama tercihine göre şekillenir.
- **Çıktı:** Konaklama Tipi adımı + tipe duyarlı mock maliyet modeli.

### Sprint 4 — V1 Demo Cilası ve Veri Etiketleme
- **Amaç:** V1'i demoya/yatırımcıya hazır, tutarlı ve dürüst (tahmini/gerçek ayrımı net) hale getirmek.
- **Teknik hedef:** Her maliyet kaleminde tutarlı "tahmini" etiketleme; hata/boş durum UX iyileştirmeleri; responsive/erişilebilirlik regresyon testleri; temel analytics event'leri.
- **Ürün hedefi:** Kullanıcı hangi verinin tahmini olduğunu her zaman net görür; V1 demo/yatırımcı sunumuna hazır.
- **Çıktı:** V1.0 — tamamlanmış, tutarlı, demoya hazır MVP.

### Sprint 5 — Gerçek Mesafe (V2 Başlangıç)
- **Amaç:** Mock mesafe servisinden gerçek Google Maps entegrasyonuna geçiş.
- **Teknik hedef:** `GoogleMapsProvider` aktivasyonu (`lib/maps`), API key yönetimi ve caching stratejisi, Otoyol Tercihi'nin gerçek `avoid: tolls` parametresiyle çalışması.
- **Ürün hedefi:** Mesafe/süre artık gerçek veri; otoyol tercihi gerçek iki senaryolu sonuç üretir.
- **Çıktı:** Canlı mesafe/süre verisi + gerçek otoyol senaryosu.

### Sprint 6 — Rota Tercihi
- **Amaç:** Kullanıcının rota optimizasyon kriterini (En Hızlı / En Ekonomik / Dengeli) seçebilmesi.
- **Teknik hedef:** Google Maps'ten birden fazla rota alternatifi çekilmesi (süre/mesafe/toll farklarına göre); `calculateTrip`'in seçilen kritere göre hangi rota senaryosunu kullanacağını belirlemesi.
- **Ürün hedefi:** Kullanıcı üç seçenek arasında tercih yapabilir, sonuç ekranı seçilen kritere göre değişir.
- **Çıktı:** Rota Tercihi seçimi + kritere duyarlı mesafe/süre/maliyet sonucu.

### Sprint 7 — Gerçek Yakıt, Elektrik ve HGS Fiyatları
- **Amaç:** Fuel Price Service'i canlı veri kaynağına bağlamak ve HGS tarifesini güncellemek.
- **Teknik hedef:** `LiveFuelPriceProvider` (şehir bazlı benzin/motorin/LPG/elektrik fiyatı kaynağına bağlanan) implementasyonu; `FuelPriceService` arayüzü sayesinde `ConfigFuelPriceProvider`'dan sorunsuz geçiş; güncel HGS tarife tablosunun entegrasyonu.
- **Ürün hedefi:** Yakıt ve otoyol maliyeti artık güncel, şehre duyarlı gerçek fiyatlarla hesaplanır.
- **Çıktı:** Canlı yakıt/elektrik/HGS fiyatı entegrasyonu.

### Sprint 8 — Elektrikli Araç Şarj Modeli ve Kullanıcı Hesabı
- **Amaç:** Basit kWh × fiyat modelinden gerçekçi şarj planlama modeline geçmek; temel kullanıcı hesabını devreye almak.
- **Teknik hedef:** Tahmini menzil, gereken şarj sayısı, AC/DC şarj süresi ve toplam maliyeti hesaplayan genişletilmiş model; `Vehicle` tipine menzil/şarj hızı alanları eklenmesi. Paralel iş kolu olarak temel kullanıcı hesabı (geçmiş hesaplamaları kaydetme/görüntüleme, misafir kullanım korunur).
- **Ürün hedefi:** Elektrikli araç kullanıcıları için gerçekçi "kaç kez şarj olurum, ne kadar sürer, ne kadara mal olur" cevabı; kullanıcılar geçmiş hesaplamalarına dönebilir.
- **Çıktı:** Gelişmiş EV şarj maliyeti modeli + temel kullanıcı hesabı.

### Sprint 9 — Tren Uygunluk Motoru, Otobüs ve Konaklama Pilotu, PDF Export
- **Amaç:** Tren seçeneğinin her rotada anlamlı gösterilmesi; otobüs ve konaklama için ilk gerçek fiyat denemeleri; sonuçların dışa aktarılabilmesi.
- **Teknik hedef:** Statik/curated şehir-çifti tren hattı veri seti + `TrainAvailabilityService`; UI'da rota için tren yoksa seçeneğin gizlenmesi/uyarı gösterilmesi. Otobüs bileti için sınırlı partner API pilotu. "Otel" konaklama tipi için tek sağlayıcı ile sınırlı şehir kapsamında fiyat pilotu. Sonuç ekranının PDF'e aktarılması.
- **Ürün hedefi:** Kullanıcı artık var olmayan bir tren seferini seçemez; otobüs ve otel için gerçek fiyata daha yakın sonuçlar görür; sonucu PDF olarak indirebilir.
- **Çıktı:** Tren Uygunluk Motoru + otobüs/otel pilotu + PDF export — **V2 tamamlanmış**.

### Sprint 10 — Karşılaştırma Ekranı (V3 Başlangıç)
- **Amaç:** Kullanıcının tüm ulaşım tiplerini yan yana karşılaştırabilmesi — vizyonun en somut hâli.
- **Teknik hedef:** Her ulaşım tipi için paralel `calculateTrip` çağrıları (araç/uçak/otobüs/tren); Tren Uygunluk Motoru'ndan gelen "uygun değil" durumunun ilgili hücrede gösterilmesi; sonuç ekranına yeni bir karşılaştırma görünümü eklenmesi (bkz. Bölüm 8).
- **Ürün hedefi:** "Bu rota için en iyi seçenek hangisi?" sorusuna doğrudan, görsel bir cevap.
- **Çıktı:** Çalışan Karşılaştırma Ekranı — **V3'ün çekirdek özelliği devrede**.

**Sprint 11 ve sonrası (V3 devamı, bu dokümanın kapsamı dışında ayrıntılandırılacak):** Uçak bileti tam entegrasyonu, tren bileti gerçek fiyatlandırması, otel/konaklama tam kapsam entegrasyonu (tüm tipler + tüm şehirler), çok duraklı rota planlama, AI destekli seyahat asistanı, çoklu para birimi desteği.

## 13. Teknik Mimari

V1'de Rotaly'nin `lib/` klasörü, her biri tek dosyadan oluşan düz bir yapıya sahiptir (`costs.ts`, `maps.ts`, `tripCalculator.ts`, `vehicles.ts`). Bu, MVP aşaması için doğru bir karardı — az sayıda kalem, tek bir mock veri kaynağı ile hızlıca çalışan bir ürün çıkarmayı önceliklendirdi. Ancak bu PRD'de tanımlanan yeni kararlar (Fuel Price Service, Rota Tercihi, Tren Uygunluk Motoru, Karşılaştırma Ekranı, çoklu gerçek veri sağlayıcısı) bu düz yapının sınırlarını zorlayacaktır. Önerilen hedef yapı:

```
lib/
  fuel/        # Yakıt/elektrik tüketim hesaplama motoru (mevcut costs.ts'in evrildiği hali)
  maps/        # Mesafe/süre/rota servisi (mevcut maps.ts'in evrildiği hali)
  trip/        # Orchestrator — tüm kalemleri birleştirir (mevcut tripCalculator.ts)
  vehicles/    # Araç kataloğu (mevcut vehicles.ts)
  pricing/     # YENİ — Fuel Price Service, HGS tarife servisi, konaklama tipi fiyat çarpanları
  services/    # YENİ — dış API adaptörleri (GoogleMapsProvider, canlı fiyat sağlayıcıları, bilet/otel API'leri)
components/    # UI bileşenleri (mevcut yapı korunur, değişmez)
```

**Neden bu yapı seçildi:**

- **Domain bazlı ayrım, dosya bazlı değil.** Her klasör tek bir sorumluluk alanını temsil eder (ne kadar yakıt tüketilir / ne kadar mesafe var / toplamda ne kadar tutar / hangi araç bu / bu ne kadara mal olur). Bir kalem büyüdükçe (ör. `fuel/` içine `types.ts`, `mockPrices.ts`, `consumptionCalculator.ts` gibi alt dosyalar eklenir) tek dosya şişmez, ilgili kişi doğrudan ilgili klasöre bakar.
- **`pricing/`, "ne kadar tüketilir" ile "bu ne kadara mal olur" sorularını birbirinden ayırır.** `fuel/` motoru "700 km, 7 L/100km → 49 litre" hesabını yapar; `pricing/` bu 49 litrenin kaç TL olduğunu söyler. Bu ayrım sayesinde Fuel Price Service mock'tan canlıya geçtiğinde (Sprint 7) `fuel/` motoruna hiç dokunulmaz — sadece `pricing/` içindeki provider değişir. Aynı ayrım HGS tarifesi ve konaklama tipi çarpanları için de geçerlidir.
- **`services/`, tüm dış API çağrılarını izole eder.** `lib/maps.ts`'te zaten kanıtlanmış olan `MapsProvider` arayüz + provider değişimi deseni (`MockMapsProvider` ↔ `GoogleMapsProvider`) genelleştirilir: `FuelPriceProvider`, `TrainAvailabilityProvider`, `HotelPriceProvider`, `FlightTicketProvider` gibi her yeni entegrasyon aynı desenle eklenir. `trip/` orchestrator'ı ve UI hiçbir zaman ham `fetch`/HTTP çağrısı yapmaz; her zaman bir arayüz üzerinden konuşur. Bu, test edilebilirliği korur ve V2/V3'teki her yeni entegrasyonun "patlama yarıçapını" (blast radius) küçültür.
- **`trip/` (orchestrator) ince kalır.** Yeni kalemler (Rota Tercihi, Tren Uygunluğu, Karşılaştırma Ekranı'nın çoklu-çağrı ihtiyacı) eklendikçe orchestrator sadece "hangi alt servisi, hangi sırayla çağırıyorum" mantığını taşır; hesaplama detayları ilgili domain klasöründe kalır. Bu, Karşılaştırma Ekranı gibi "aynı orchestrator'ı 4 farklı ulaşım tipi için paralel çağırma" ihtiyacını doğal olarak destekler.
- **Geçiş kademeli olacak, büyük patlamalı yeniden yazım olmayacak.** "Önce çalışan ürün" ilkesine sadık kalmak için mevcut dosyalar bir anda klasörlere bölünmeyecek. Her domain, o domain üzerinde çalışılan sprint geldiğinde (ör. `pricing/` Sprint 2'de Fuel Price Service ile, `services/` Sprint 5'te Google Maps aktivasyonuyla) klasöre dönüştürülecek; dönüşüm sırasında dışa açılan public API (fonksiyon imzaları) korunarak diğer modüllerin bozulması engellenecektir.
- **Bilinen açık:** Fuel Price Service kapsamı LPG'yi de içerir, ancak mevcut `FuelType` (benzinli/dizel/hibrit/elektrikli) LPG'yi henüz bir araç yakıt tipi olarak tanımlamaz. Bu, `vehicles/` ve `fuel/` için ayrı bir mühendislik kalemi olarak Sprint 2 kapsamına not düşülmelidir (LPG'nin `FuelType` enum'una eklenmesi ve ilgili araçların kataloğa girmesi).

---

## Ek: Özel Konular Özet Tablosu

Görev tanımında özellikle işaret edilen konuların v1.0'daki durumu ve hedef fazı:

| Konu | V1 Durumu | Hedef Faz |
|---|---|---|
| Otoyol kullan/kullanma tercihi | Resmi akış adımı (Sprint 1); mock senaryo | V1 (mock) → V2 gerçek Maps verisiyle (Sprint 5) |
| Fuel Price Service (gerçek yakıt fiyatları) | Adı konmuş servis; V1'de config tabanlı provider (Sprint 2) | V2 canlı veri sağlayıcısı (Sprint 7) |
| Elektrikli araç şarj maliyeti | V1'de basit kWh × mock fiyat | V2 gelişmiş model: menzil, şarj sayısı, AC/DC, süre (Sprint 8) |
| Konaklama tipi (Otel/Apart/Bungalov/Kamp/Arkadaşta Kalacağım) | Resmi akış adımı, tipe özgü mock çarpan (Sprint 3) | V2 "Otel" pilotu (Sprint 9) → V3 tüm tipler tam kapsam |
| Tren her rota için uygun olmayabilir | Kontrol yok (V1) | V2 Tren Uygunluk Motoru, statik veri seti (Sprint 9) |
| Uçak bileti entegrasyonu | Yok, yalnızca ulaşım tipi seçimi var | V3 (Sprint 11+) |
| Karşılaştırma Ekranı | Yok | V3 (Sprint 10) — yeni marka özellik |
| Rota Tercihi (Hızlı/Ekonomik/Dengeli) | Yok, tek senaryo | V2 (Sprint 6), Sprint 5'teki canlı Maps'e bağımlı |
| Tahmini ve gerçek veri ayrımı | V1'de **tüm** veriler tahminidir; her kalemde tutarlı "tahmini" etiketleme (Sprint 4) | Kademeli: kalemler gerçekleştikçe (V2 → V3) ilgili etiket kalkar |
