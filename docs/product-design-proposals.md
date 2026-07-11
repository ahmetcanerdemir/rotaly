# Rotaly — Ürün Geliştirme Önerileri (Product Design)

**Referans doküman:** `docs/PRD.md` — v1.0 Onaylanmış Yol Haritası
**Bu doküman:** PRD'yi değiştirmez; PRD'nin V2/V3 ufkunu ve büyüme/gelir tarafını derinleştiren, henüz roadmap'e resmi olarak işlenmemiş 10 ürün alanı için tasarım önerisi sunar. Kod içermez.

Rotaly'nin v1.0 vizyonu şudur: *"kullanıcıların seyahat öncesinde en doğru ulaşım kararını verebilmesini sağlayan akıllı seyahat bütçe planlama platformu."* Aşağıdaki 10 öneri bu vizyonu iki yönde genişletir: (a) kullanıcıya **daha doğru ve daha kişisel** bir karar desteği sunmak (Seyahat Takvimi, Gidiş-Dönüş, Tasarruf Önerileri), (b) kullanıcıyı **elde tutmak ve işi sürdürülebilir kılmak** (Kaydedilen Seyahatler, Paylaşım, Premium, Gelir Modeli, Retention).

---

## 1. Seyahat Takvimi

**Kullanıcı problemi:** Kullanıcı "ne zaman gitmenin daha ucuza geleceğini" bilmiyor. Aynı rota, hafta içi/hafta sonu, sezon, resmi tatil gibi faktörlere göre çok farklı maliyete gelebilir, ama Rotaly şu an yalnızca "şimdi gidersen ne kadar tutar" sorusuna cevap veriyor.

**Çözüm:** Kullanıcının seçtiği rota için önümüzdeki günler/haftalar boyunca tahmini bütçe farkını gösteren, renk kodlu bir takvim görünümü (yeşil = görece ucuz, kırmızı = görece pahalı gün). Kullanıcı bir tarihe dokunduğunda o günün tahmini kalem kırılımını görür.

**Teknik yaklaşım:** `calculateTrip`'e opsiyonel bir `travelDate` parametresi eklenir. `pricing/` modülüne gün tipine (hafta içi/hafta sonu), sezona ve resmi tatillere göre mock çarpan tablosu eklenir (ör. yaz sezonu konaklama +%20, resmi tatil öncesi/sonrası yakıt/otobüs talebi +%10). Takvim, bu çarpanlarla günlük toplamı önceden hesaplayıp bir "heatmap" bileşeninde gösterir. V2 sonunda gerçek fiyat kaynakları (Fuel Price Service, otel API'si) bağlandıkça çarpanlar gerçek veriyle değiştirilir.

**Faz:** **V2.** İlk (mock çarpanlı) hali dış veri gerektirmez ve teknik olarak V1'e de sığabilirdi, ama yeni bir UI bileşeni (heatmap) ve tarih-bazlı hesaplama modeli gerektirdiği için V1'in "minimum çalışan ürün" kapsamını gereksiz şişirmemek adına V2'ye bırakıldı.

**Geliştirme zorluğu:** Orta (mock sürüm) → Zor (gerçek sezonsal/talep verisiyle kalibrasyon).

**Kullanıcı değeri (1-10):** **7/10** — karar kalitesini doğrudan artırır ama hayati değildir; "olsa güzel olur" ile "olmazsa olmaz" arası.

---

## 2. Gidiş-Dönüş Desteği

**Kullanıcı problemi:** Neredeyse hiçbir seyahat tek yönlü değildir, ama Rotaly şu an yalnızca tek yön mesafe/maliyet üzerinden çalışıyor. Kullanıcı gerçek toplam maliyeti göremiyor ve zihninden ×2 yapmak zorunda kalıyor — bu, ürünün en temel değer önermesiyle (gerçek toplam maliyet) doğrudan çelişen bir eksik.

**Çözüm:** Akışa "Gidiş-Dönüş mü, Tek Yön mü?" seçimi eklemek. Gidiş-dönüş seçilirse mesafe, yakıt, otoyol ve (ileride) bilet kalemleri buna göre ikiye katlanır; isteğe bağlı olarak farklı bir dönüş tarihi seçilebilir (Seyahat Takvimi ile doğal olarak birleşir).

**Teknik yaklaşım:** Mevcut mimari bunun için zaten hazır: `FuelCalculationInput` ve toll (HGS) hesaplaması `roundTrip?: boolean` alanını **halihazırda destekliyor**, sadece UI'da hiçbir yerde kullanıcıya sorulmuyor. Bu nedenle iş, yeni bir hesaplama motoru değil, akışa tek bir adım/toggle eklemek ve mevcut `roundTrip` alanını `calculateTrip` çağrısına bağlamaktır.

**Faz:** **MVP (V1).** Motor zaten destekliyor, tek eksik olan bir UI adımı olduğu için "önce çalışan ürün" ilkesine tam uyan, düşük efor / yüksek etki bir V1 tamamlama işidir. PRD'nin Sprint 1–4 aralığına ek bir hızlı kazanım (quick win) olarak eklenmesi önerilir.

**Geliştirme zorluğu:** Kolay.

**Kullanıcı değeri (1-10):** **9/10** — temel doğruluk sorunudur, neredeyse her kullanıcıyı etkiler.

---

## 3. Tasarruf Önerileri Motoru

**Kullanıcı problemi:** Kullanıcı sonuç ekranında bir rakam görüyor ama "bunu nasıl düşürebilirim?" sorusuna hiçbir cevap alamıyor. Karar desteği vizyonu yalnızca "ne kadar tutar"da kalıyor, "daha iyisi var mı"ya geçmiyor.

**Çözüm:** Sonuç ekranına, hesaplanan senaryoya göre otomatik üretilen kısa öneriler eklemek. Örnekler: *"Otobüsle gitsen tahmini %35 daha ucuza gelir."*, *"Otoyollardan kaçınırsan ~120 TL tasarruf edersin, ama yolculuğun 40 dk uzar."*, *"1 gün geç gitsen (hafta içi) tahmini %10 daha ucuza gelir."* (Seyahat Takvimi'nden beslenir).

**Teknik yaklaşım:** İlk sürüm, `trip/` orchestrator'ının aynı girdilerle farklı senaryolar (farklı ulaşım tipi, farklı otoyol tercihi, farklı tarih) için birden çok kez çağrılıp sonuçların karşılaştırılmasıyla çalışan **kural tabanlı** (if/else, eşik bazlı) bir motordur — bu, PRD'de V3 için planlanan Karşılaştırma Ekranı'nın alt yapısını erken ve sınırlı biçimde kullanır. Yeni bir `lib/recommendations/` modülü önerilir. Zamanla (V3) bu motor, PRD'de zaten V3 hedefi olan "AI destekli seyahat asistanı"na evrilir.

**Faz:** **V2** (kural tabanlı, basit sürüm) → **V3** (AI destekli, kişiselleştirilmiş sürüm — mevcut PRD'deki AI asistan hedefiyle birleşir).

**Geliştirme zorluğu:** Orta (V2 kural tabanlı) / Zor (V3 AI destekli).

**Kullanıcı değeri (1-10):** **8/10** — vizyonun "karar destek" tarafını en somut şekilde hayata geçiren özelliklerden biri.

---

## 4. Kaydedilen Seyahatler

**Kullanıcı problemi:** Kullanıcı bir hesaplama yapıyor, sekmeyi kapatıyor ve her şeyi kaybediyor. Aynı parametreleri tekrar tekrar girmek zorunda kalıyor; birden fazla alternatif seyahati (ör. "Antalya'ya araçla mı gitsem, İzmir'e mi gitsem") yan yana tutamıyor.

**Çözüm:** Sonuç ekranına "Bu hesaplamayı kaydet" butonu; kullanıcının kayıtlı seyahatlerini listeleyen bir sayfa. Misafir kullanıcılar için cihaz bazlı (yerel) kayıt, hesap oluşturunca senkronize kalıcı kayıt.

**Teknik yaklaşım:** PRD'de zaten V2 Sprint 8 kapsamında "temel kullanıcı hesabı" olarak planlı; bu öneri onu somutlaştırır. Bir `SavedTrip` kaydı, `TripCalculationInput` + `TripCalculationResult` çiftinin anlık görüntüsünü (snapshot) tutar — bu sayede fiyatlar zamanla değişse de kullanıcı "o an ne görmüştü"yü net hatırlar. Misafir kullanıcı için `localStorage`, hesaplı kullanıcı için backend kaydı. Retention (Bölüm 8) ve Paylaşılabilir Sonuç Sayfası (Bölüm 5) doğrudan bu altyapı üzerine kurulur.

**Faz:** **V2** (PRD Sprint 8 ile aynı zaman dilimi).

**Geliştirme zorluğu:** Orta (misafir/yerel kayıt kolay; hesap senkronizasyonu ve veri modeli orta-zor).

**Kullanıcı değeri (1-10):** **7/10** — güçlü bir kullanılabilirlik iyileştirmesi ve retention çapası.

---

## 5. Paylaşılabilir Sonuç Sayfası

**Kullanıcı problemi:** Kullanıcı hesapladığı bütçeyi aile/arkadaş grubuyla paylaşmak istiyor (ör. "Bakın bu tatile gitsek şu kadar tutuyor") ama tek yolu ekran görüntüsü almak; bu hem çirkin hem de Rotaly'yi görünür kılmıyor (büyüme fırsatı kaçıyor).

**Çözüm:** Sonuç ekranına "Paylaş" butonu; benzersiz, salt-okunur bir genel bağlantı (ör. `rotaly.app/s/[id]`) üretir. Bu sayfa WhatsApp/Twitter gibi platformlarda güzel bir önizleme (Open Graph görseli: rota, toplam bütçe, Rotaly markası) ile açılır ve sonunda "Sen de kendi rotanı hesapla" çağrısı (CTA) içerir — böylece paylaşım aynı zamanda bir büyüme kanalı olur.

**Teknik yaklaşım:** Kaydedilen Seyahatler (Bölüm 4) ile aynı veri modelini kullanır; paylaşılan kayıt salt-okunur bir görünümle sunulur. Dinamik Open Graph görseli üretimi (Next.js'in görsel üretim API'leri) gerekir. Paylaşılan sayfa, gerçek kullanıcı hesabı gerektirmez (misafir kullanıcı da paylaşabilir).

**Faz:** **V2** — Kaydedilen Seyahatler'e bağımlı olduğu için ondan hemen sonra, PDF export ile aynı döneme (PRD Sprint 9 civarı) yerleştirilmesi mantıklı.

**Geliştirme zorluğu:** Orta (paylaşım sayfası + OG görsel üretimi; bilinen bir teknik desen, ama detay işçiliği gerektirir).

**Kullanıcı değeri (1-10):** **6/10** — kullanıcının doğrudan sorununu çözmüyor ama sosyal kullanım/organik büyüme değeri yüksek (growth-loop özelliği).

---

## 6. Premium Üyelik Modeli

**Kullanıcı problemi:** Sık seyahat eden kullanıcılar, aileler ve içerik üreticileri gibi "ağır kullanıcılar", ücretsiz sürümün sunduğundan daha fazlasını (sınırsız kayıt, reklamsız/limitsiz karşılaştırma, gelişmiş öneriler) istiyor; Rotaly bu talebi karşılayacak bir katman sunmuyor.

**Çözüm:** "Rotaly Pro" adında bir abonelik katmanı: sınırsız Kaydedilen Seyahat, filigransız/özelleştirilebilir PDF export, Tasarruf Önerileri Motoru'nun tam/AI destekli sürümü, Karşılaştırma Ekranı'nda sınırsız sorgu, gelecekte "aile hesabı" (birden fazla kullanıcının bütçeyi birlikte planlaması).

**Teknik yaklaşım:** Yeni bir yetkilendirme (entitlement) katmanı: kullanıcı kaydına bağlı bir abonelik durumu alanı, özellik bazlı kullanım sayaçları (ör. aylık karşılaştırma sayısı) ve bir ödeme sağlayıcı entegrasyonu (Stripe/iyzico gibi). PRD'nin "V1'de Kesinlikle Olmayacaklar" listesinde zaten "ödeme/satın alma akışı yok" maddesi var; bu, o kısıtın doğal ve planlı bir şekilde kaldırıldığı ilk nokta olur.

**Faz:** **V3.** Ödeme altyapısı ve abonelik yönetimi gerektirir; ürün-pazar uyumu (özellikle Karşılaştırma Ekranı ve Tasarruf Önerileri gibi "neden ödeyeyim" hissi yaratacak özellikler) netleşmeden erken parasallaştırma, hem mühendislik hem güven riski taşır.

**Geliştirme zorluğu:** Zor (ödeme, abonelik durumu, feature-gating, fatura/iptal akışları).

**Kullanıcı değeri (1-10):** **5/10** — doğrudan kullanıcı değeri ücretsiz sürüme göre artımlıdır (temel ihtiyaç zaten ücretsizde karşılanıyor); asıl değeri iş sürdürülebilirliğindedir.

---

## 7. Gelir Modeli

**Ürün/iş problemi:** Rotaly, kullanıcıya gerçek değer üreten ama şu an hiçbir gelir kaynağı olmayan bir araç. Sürdürülebilir olması için, kullanıcı güvenini (Bölüm 1'de tanımlanan "bütçe şeffaflığı" konumunu) zedelemeyen bir gelir stratejisi gerekiyor.

**Çözüm — çok katmanlı bir model önerilir:**

1. **Freemium + Premium abonelik** (Bölüm 6) — doğrudan gelir, kullanıcı deneyimini bozmadan.
2. **Affiliate/komisyon geliri** — Karşılaştırma Ekranı'ndan veya sonuç ekranından bilet/otel/araç kiralama sağlayıcılarına yönlendirilen tıklamalarda komisyon (Booking.com, Enuygun, THY/acente ortaklık modelleri gibi). Bu, Rotaly'nin "rezervasyon platformu değiliz" konumunu bozmaz — Rotaly asla ödeme almaz, yalnızca yönlendirir.
3. **B2B / API lisanslama** — Trip Calculator + Fuel Price Service motorunun, kendi sitesinde "bu araçla gidersen ne kadar tutar" göstermek isteyen üçüncü taraflara (araç kiralama, oto galeri, seyahat acentesi) API olarak sunulması.
4. **Şeffaf sponsorluk** — sonuç ekranında "sponsorlu" etiketiyle açıkça işaretlenmiş öne çıkan araç/otel/rota önerileri (kullanıcı güvenini korumak için gizli reklam yapılmaz).

**Teknik yaklaşım:** Affiliate linkleri, zaten V2/V3'te planlanan bilet/otel API entegrasyonlarına (`services/`) bir yönlendirme (referral) parametresi eklemekten ibarettir — marjinal ek iştir. B2B API için `trip/` orchestrator'ının, kimlik doğrulama ve hız sınırlama (rate limiting) ile korunan ayrı bir "platform API" katmanı olarak dışa açılması gerekir; bu, Rotaly'nin ana tüketici ürününden ayrı bir iş kolu olarak planlanmalıdır.

**Faz:** Affiliate geliri **V3** (bilet/otel entegrasyonlarına bağımlı); Premium **V3**; B2B API **V3 sonrası**, ayrı bir iş kolu olarak ele alınmalı ve bu PRD'nin tüketici odaklı kapsamının dışında ayrıca planlanmalıdır.

**Geliştirme zorluğu:** Zor (hem iş geliştirme/ortaklık hem teknik entegrasyon gerektirir).

**Kullanıcı değeri (1-10):** **6/10** — affiliate/yönlendirme modeli kullanıcıya gerçek bir kolaylık (tek tıkla rezervasyona geçiş) sunduğu için değerlidir; B2B ve sponsorluk kullanıcıya doğrudan değil, dolaylı (ürünün var olmaya devam etmesi yoluyla) değer sağlar.

---

## 8. Retention Özellikleri (Kullanıcının Tekrar Gelmesini Sağlayacak Özellikler)

**Kullanıcı problemi:** Rotaly şu an tek seferlik bir araç gibi kullanılıyor: kullanıcı bir hesaplama yapıp ayrılıyor ve geri dönmesi için hiçbir tetikleyici yok. Oysa seyahat planlama, doğası gereği zaman içinde tekrar ziyaret edilen (fiyat değişti mi, tarih netleşti mi) bir süreçtir.

**Çözüm — birbirini güçlendiren dört mekanizma:**

1. **Fiyat/bütçe değişikliği bildirimi:** Kullanıcı bir seyahati kaydettiyse (Bölüm 4) ve o rotanın tahmini maliyeti önemli ölçüde değişirse (yakıt zammı, sezon geçişi) bildirim gönderilir.
2. **"En iyi tarih yaklaşıyor" bildirimi:** Seyahat Takvimi'nin (Bölüm 1) tespit ettiği ucuz bir tarih yaklaştığında hatırlatma.
3. **Mevsimsel tekrar hatırlatma:** "Geçen sene bu rotayı hesaplamıştın, bu yıl tekrar bakmak ister misin?" — özellikle yıllık tekrar eden tatil rotalarını hedefler.
4. **Kaydedilen Seyahatler listesi** (Bölüm 4) — kendi başına bir "geri dönme çapasıdır"; kullanıcı listesine bakmak için bile geri döner.

**Teknik yaklaşım:** Bildirim altyapısı (e-posta önce, push sonra) ve zamanlanmış görevler (cron/scheduled jobs) gerektirir; bu görevler kayıtlı seyahatlerin güncel fiyatlarla periyodik olarak yeniden hesaplanmasını (`calculateTrip`'in arka planda tekrar çağrılması) ve eşik aşıldığında bildirim tetiklenmesini içerir. Yeni bir `services/notifications` modülü önerilir; bu modül, kullanıcı hesabı (V2) üzerine kurulur.

**Faz:** **V2** (temel: kaydedilen seyahat + e-posta hatırlatma) → **V3** (push bildirim + akıllı zamanlama, muhtemelen Tasarruf Önerileri Motoru'nun AI sürümüyle birleşerek "en iyi anı sana söylerim" hâline gelir).

**Geliştirme zorluğu:** Orta (V2, e-posta) → Zor (V3, push + akıllı zamanlama + arka plan yeniden hesaplama ölçeklenebilirliği).

**Kullanıcı değeri (1-10):** **8/10** — Rotaly'yi "tek seferlik hesap makinesi"nden "düzenli danışılan bir seyahat asistanı"na taşıyan, retention açısından en kritik madde.

---

## 9. Kullanıcıyı Satın Almaya Yönlendirecek Premium Özellikler

**Kullanıcı problemi:** Ücretsiz kullanıcı, ücretli sürüme neden geçmesi gerektiğini anlamıyor; değer net değilse veya erken bir "paywall" ile karşılaşırsa ürünü tamamen terk edebilir.

**Çözüm — "önce değer, sonra sınır" yaklaşımı:**

- **Karşılaştırma Ekranı:** Ücretsiz kullanıcıya aylık sınırlı sayıda karşılaştırma (ör. 3), premium'da sınırsız.
- **Tasarruf Önerileri Motoru:** Basit/kural tabanlı öneriler herkese açık kalır; AI destekli, derinlemesine öneriler premium'a özeldir.
- **PDF Export:** Ücretsizde filigranlı/sınırlı, premium'da filigransız ve özelleştirilebilir.
- **Kaydedilen Seyahatler:** Ücretsizde sınırlı sayı (ör. 3 seyahat), premium'da sınırsız.
- **Hedefli teklif:** Kaydedilen seyahat/karşılaştırma sayısı yüksek olan (yani üründen zaten çok değer alan) kullanıcılara, uygulama içinde nazik bir premium teklifi gösterme.

**Teknik yaklaşım:** Bir yetkilendirme/özellik bayrağı (entitlement / feature-flag) katmanı; her sınırlı özelliğin kullanım sayacının kullanıcı kaydına bağlı tutulması. Bu katman, Premium Üyelik Modeli (Bölüm 6) ile birlikte tasarlanmalı, ayrı düşünülmemelidir.

**Faz:** **V3** — Premium modelinden bağımsız var olamaz, onunla birlikte gelir.

**Geliştirme zorluğu:** Orta-Zor (entitlement/feature-flag altyapısı + kullanım sayaçları + her özellik için "nerede sınır konur" ürün kararları).

**Kullanıcı değeri (1-10):** **4/10** — dürüst olmak gerekirse bu madde öncelikle işin sürdürülebilirliği içindir; kullanıcıya doğrudan yeni bir fayda sunmaz, var olan faydaya sınır koyar. İyi tasarlanırsa (cömert ücretsiz sınırlar, net "neden premium" mesajı) deneyimi bozmadan uygulanabilir.

---

## 10. MVP Dışında Bırakılması Gereken Özellikler

Yukarıdaki 9 öneri arasından, MVP'nin ("önce çalışan ürün") sağlığını korumak için **kesinlikle V1'e alınmaması gereken** maddeler ve gerekçeleri:

| Özellik | Neden MVP Dışı | Önerilen Faz |
|---|---|---|
| Premium Üyelik Modeli (Bölüm 6) | Ödeme/abonelik altyapısı gerektirir; PRD'nin V1 istisnaları listesindeki "ödeme akışı yok" ilkesini doğrudan ihlal eder | V3 |
| Gelir Modeli — Affiliate/B2B/Sponsorluk (Bölüm 7) | Bilet/otel entegrasyonlarına (V2/V3) ve iş ortaklıklarına bağımlı; erken parasallaştırma güven riski taşır | V3 / V3 sonrası |
| Premium'a Yönlendirme Tetikleyicileri (Bölüm 9) | Premium modelinden bağımsız var olamaz | V3 |
| Tasarruf Önerileri Motoru — AI destekli sürüm (Bölüm 3) | Yüksek mühendislik maliyeti, olgun bir Karşılaştırma Ekranı ve veri altyapısı gerektirir | V3 |
| Retention — Push bildirim + akıllı zamanlama (Bölüm 8) | Bildirim altyapısı + arka plan yeniden hesaplama ölçeklenebilirliği gerektirir; e-posta ile başlanmalı | V3 (V2'de e-posta ile başlanır) |
| Seyahat Takvimi — gerçek sezonsal/talep verisiyle kalibrasyon (Bölüm 1) | Gerçek veri kaynağı ve kalibrasyon çalışması gerektirir; mock hâli bile V1 kapsamını şişirir | V2 (mock) → V3 (kalibre) |
| Paylaşılabilir Sonuç Sayfası (Bölüm 5) | Kaydedilen Seyahatler'e bağımlı, kendisi de temel karar-destek problemini çözmüyor | V2 |
| Kaydedilen Seyahatler (Bölüm 4) | Kullanıcı hesabı/oturum altyapısı gerektirir; PRD'nin V1 istisnaları listesinde zaten "kullanıcı hesabı yok" olarak işaretli | V2 |

**Genel ilke:** V1'e yalnızca **dış veri/API gerektirmeyen ve tek seferlik oturumda değer üreten** özellikler alınmalıdır (bu yüzden Gidiş-Dönüş Desteği MVP'ye girerken, aynı derecede basit görünen ama kullanıcı hesabı/ödeme/bildirim gibi kalıcı altyapı gerektiren hiçbir madde V1'e alınmamıştır).

---

## Özet: Değer / Zorluk Matrisi

Yukarıdaki 9 özelliğin (10. madde hariç, o zaten bir hariç tutma listesi) hızlı karşılaştırması:

| # | Özellik | Faz | Zorluk | Kullanıcı Değeri |
|---|---|---|---|---|
| 2 | Gidiş-Dönüş Desteği | MVP (V1) | Kolay | 9/10 |
| 8 | Retention Özellikleri | V2 → V3 | Orta → Zor | 8/10 |
| 3 | Tasarruf Önerileri Motoru | V2 → V3 | Orta → Zor | 8/10 |
| 4 | Kaydedilen Seyahatler | V2 | Orta | 7/10 |
| 1 | Seyahat Takvimi | V2 → V3 | Orta → Zor | 7/10 |
| 7 | Gelir Modeli | V3 / sonrası | Zor | 6/10 |
| 5 | Paylaşılabilir Sonuç Sayfası | V2 | Orta | 6/10 |
| 6 | Premium Üyelik Modeli | V3 | Zor | 5/10 |
| 9 | Premium'a Yönlendirme Tetikleyicileri | V3 | Orta-Zor | 4/10 |

**Okuma:** Tablo, en yüksek değer/en düşük efor oranına sahip **Gidiş-Dönüş Desteği**'nin neden ilk sırada (MVP) olması gerektiğini, buna karşılık iş modeli maddelerinin (Premium, Gelir Modeli, Premium tetikleyicileri) neden bilinçli olarak en sona bırakıldığını görsel olarak doğrular — Rotaly önce kullanıcı değerini kanıtlamalı, sonra parasallaşmalıdır.
