// FitMyBit metric registry: how to read each metric out of the synced data, and a plain-language
// explanation for users. Keys are matched loosely against the flattened Google Health API fields.
//
// Each metric:
//   id, label, group, type (gh_daily.data_type), unit, d (decimals)
//   keys: ordered regexes tried against metric field names; conv(key, value) converts units
//   core: always shown on the home screen even without data
//   higher: "good" | "bad" | "neutral" — used to colour the change vs. average
//   info: { what, how, range, up, down, affects, tip }

const secToH = (k, v) => (/_s$/.test(k) ? v / 3600 : /min/i.test(k) ? v / 60 : v > 1000 ? v / 3600 : v / 60);
const secToMin = (k, v) => (/_s$/.test(k) ? v / 60 : v);

window.FMB_GROUPS = [
  { id: "activity", label: "Aktivite" },
  { id: "sleep", label: "Uyku" },
  { id: "heart", label: "Kalp ve toparlanma" },
  { id: "body", label: "Vücut" },
  { id: "logs", label: "Kayıtlar ve kontroller" },
];

window.FMB_METRICS = [
  /* ---------------- Aktivite ---------------- */
  {
    id: "steps", label: "Adım", group: "activity", type: "steps", unit: "", d: 0, core: true, higher: "good",
    keys: [/countsum/i, /count/i, /.*/],
    info: {
      what: "Gün boyunca attığın toplam adım sayısı. Gün içindeki genel hareketliliğinin en basit göstergesi.",
      how: "Saat veya bileklik, kolunun ritmik sallanmasını hareket sensörüyle (ivmeölçer) algılayıp adıma çevirir. Telefon cebindeyse o da sayabilir; ikisi birden varsa Google tekrarları ayıklar.",
      range: "Sık söylenen hedef 10.000 adımdır, ama araştırmalar sağlık faydasının büyük kısmının günde yaklaşık 7.000–8.000 adımda geldiğini gösteriyor. 5.000'in altı 'hareketsiz' sayılır.",
      up: "Daha hareketli bir gün geçirdin demektir. Yürüyüş, merdiven, ayakta iş hepsi sayılır.",
      down: "Masa başı, yolculuk, hastalık veya dinlenme günü olabilir. Tek bir düşük gün sorun değil; haftalık ortalamaya bak.",
      affects: "İşin türü, ulaşım şekli, hava durumu, hafta içi/sonu farkı. Bisiklet ve yüzme adım olarak pek sayılmaz.",
      tip: "Telefonla konuşurken yürümek veya öğle arasında 10 dakikalık yürüyüş günde 1.000–1.500 adım ekler.",
    },
  },
  {
    id: "distance", label: "Mesafe", group: "activity", type: "distance", unit: "km", d: 1, higher: "good",
    keys: [/millimet/i, /kilomet/i, /met/i, /sum/i, /.*/],
    conv: (k, v) => (/millimet/i.test(k) ? v / 1e6 : /kilomet/i.test(k) ? v : /met/i.test(k) ? v / 1000 : v > 500 ? v / 1000 : v),
    info: {
      what: "Gün içinde yürüyerek veya koşarak katettiğin tahmini mesafe.",
      how: "Adım sayın, boyuna göre hesaplanan adım uzunluğuyla çarpılır. GPS'li bir egzersiz kaydettiysen o bölüm için GPS mesafesi kullanılır.",
      range: "Kişiye göre çok değişir. Kabaca 7.000–8.000 adım, ortalama boydaki biri için 5–6 km eder.",
      up: "Daha uzun yürüyüş/koşu yaptın.",
      down: "Daha az hareket ettin; adım sayısıyla birlikte düşer.",
      affects: "Adım uzunluğu ayarın yanlışsa mesafe sistematik olarak fazla/az çıkar.",
      tip: "Mesafeyi adımla birlikte oku; tek başına ek bir bilgi vermez.",
    },
  },
  {
    id: "floors", label: "Kat", group: "activity", type: "floors", unit: "kat", d: 0, higher: "good",
    keys: [/countsum/i, /count/i, /.*/],
    info: {
      what: "Yukarı doğru çıktığın kat sayısı. Bir kat yaklaşık 3 metre yükselmeye denk gelir.",
      how: "Cihazdaki barometrik altimetre hava basıncındaki değişimi ölçer; yürürken yaklaşık 3 m yükselince bir kat sayılır.",
      range: "Günde 10 kat, birçok cihazın varsayılan hedefidir.",
      up: "Merdiven veya yokuş çıktın — kısa sürede nabzı yükselten iyi bir egzersizdir.",
      down: "Düz zeminde kaldın ya da asansör kullandın.",
      affects: "Hava basıncı değişimleri (fırtına, uçak, araba) bazen hatalı kat yazdırabilir.",
      tip: "Asansör yerine 2–3 kat merdiven, günlük kardiyoya kolay bir katkıdır.",
    },
  },
  {
    id: "azm", label: "Aktif bölge dakikası", group: "activity", type: "active-zone-minutes", unit: "dk", d: 0, core: true, higher: "good",
    keys: [/total/i, /sum/i, /minutes/i, /_s$/, /.*/], conv: secToMin,
    compute: (m) => { const z = Object.entries(m).filter(([k]) => /sumIn\w*Zone/i.test(k)); return z.length ? z.reduce((a, [, v]) => a + v, 0) : undefined; },
    info: {
      what: "Kalbini 'çalıştırdığın' dakikaların sayısı. Fitbit/Google'ın, nabzına göre efor süresini ölçen metriği.",
      how: "Nabzın yağ yakım bölgesindeyken her dakika 1, kardiyo veya zirve bölgesindeyken her dakika 2 puan sayılır. Bölgeler yaşına ve dinlenme nabzına göre kişisel hesaplanır.",
      range: "Dünya Sağlık Örgütü haftada 150 dakika orta tempolu aktivite öneriyor; bu da yaklaşık haftada 150 aktif bölge dakikası, günde ortalama ~22 dakika demek.",
      up: "Tempolu yürüyüş, koşu, spor gibi kalbini zorlayan aktivite yaptın.",
      down: "Hafif bir gün geçirdin. Dinlenme günleri de gereklidir; haftalık toplama bak.",
      affects: "Nabız ölçümünün doğruluğu (bileklik gevşekse düşük çıkar), ısı, kafein, stres.",
      tip: "Normal yürüyüşü konuşabileceğin ama şarkı söyleyemeyeceğin bir tempoya çıkarmak bu dakikaları hızla artırır.",
    },
  },
  {
    id: "active_min", label: "Aktif dakika", group: "activity", type: "active-minutes", unit: "dk", d: 0, higher: "good",
    keys: [/total/i, /sum/i, /minutes/i, /_s$/, /.*/], conv: secToMin,
    info: {
      what: "En az orta yoğunlukta hareket ettiğin toplam süre (en az ~10 dakikalık bloklar).",
      how: "Hareket sensörü verisinden, yürüyüşten daha yoğun hareket edilen süreler hesaplanır.",
      range: "Günde 30 dakika iyi bir hedeftir.",
      up: "Daha uzun süre tempolu hareket ettin.",
      down: "Gün çoğunlukla hafif hareket veya oturarak geçti.",
      affects: "Aktivite türü; ağırlık antrenmanı gibi yerinde yapılan sporlar az sayılabilir.",
      tip: "Aktif bölge dakikasıyla birlikte oku: biri hareketi, diğeri kalbin ne kadar çalıştığını gösterir.",
    },
  },
  {
    id: "calories", label: "Toplam kalori", group: "activity", type: "total-calories", unit: "kcal", d: 0, core: true, higher: "neutral",
    keys: [/kcal/i, /kilocal/i, /calor/i, /energy/i, /sum/i, /.*/],
    info: {
      what: "Gün içinde harcadığın toplam enerji: vücudunun dinlenirken yaktığı (bazal metabolizma) + hareketle yaktığın.",
      how: "Bazal kısım boy, kilo, yaş ve cinsiyetten hesaplanır; üstüne nabız ve hareket verisinden aktivite kalorisi eklenir. Uyurken de kalori yakarsın, o yüzden bu sayı hiç sıfır olmaz.",
      range: "Yetişkinlerde tipik olarak 1.800–3.000 kcal; kiloya ve hareketliliğe göre değişir. Bazal kısım genelde toplamın %60–70'idir.",
      up: "Daha hareketli bir gün.",
      down: "Daha sakin bir gün; bazal kalorinin altına inmez.",
      affects: "Profilindeki kilo ve boy bilgisi güncel değilse tahmin sapar. Bileklik tahminleri ±%10–20 hata payı taşır.",
      tip: "Kesin bir sayıdan çok, kendi günlerini karşılaştırmak için kullan.",
    },
  },
  {
    id: "active_kcal", label: "Aktif kalori", group: "activity", type: "active-energy-burned", unit: "kcal", d: 0, higher: "good",
    keys: [/kcal/i, /kilocal/i, /calor/i, /energy/i, /sum/i, /.*/],
    info: {
      what: "Sadece hareket ederek yaktığın kalori; dinlenirken harcanan bazal enerji hariç.",
      how: "Nabız ve hareket verisinden hesaplanır.",
      range: "Hareketsiz bir günde 200–300 kcal, aktif bir günde 600+ kcal görülebilir.",
      up: "Egzersiz veya yoğun hareket.",
      down: "Sakin bir gün.",
      affects: "Nabız ölçüm kalitesi, profil bilgileri.",
      tip: "Toplam kaloriden daha iyi bir 'ne kadar hareket ettim' göstergesidir.",
    },
  },
  {
    id: "sedentary", label: "Hareketsiz süre", group: "activity", type: "sedentary-period", unit: "sa", d: 1, higher: "bad",
    keys: [/_s$/, /minutes/i, /sum/i, /.*/], conv: secToH,
    info: {
      what: "Uyanıkken oturarak veya uzanarak geçirdiğin toplam süre.",
      how: "Hareket sensörü uzun süre neredeyse hiç hareket algılamadığında bu süreye eklenir. Uyku hariç tutulur.",
      range: "Kesin bir sınır yok, ama araştırmalar günde 8–10 saatin üzerindeki oturmanın riskleri artırdığını gösteriyor.",
      up: "Uzun masa başı, yolculuk veya dinlenme günü.",
      down: "Gün içine daha çok hareket serpiştirdin.",
      affects: "Masa başı iş, ekran süresi, hava koşulları.",
      tip: "Her saat başı 2–3 dakika kalkıp yürümek, uzun oturmanın etkisini azaltır.",
    },
  },
  {
    id: "exercise", label: "Egzersiz", group: "activity", type: "exercise", unit: "dk", d: 0, higher: "good",
    keys: [/^total_minutes$/], countKey: "count",
    info: {
      what: "Kaydedilen veya otomatik algılanan egzersiz seanslarının toplam süresi.",
      how: "Saatte başlattığın egzersizler ya da en az ~15 dakika süren tempolu hareketlerin otomatik algılanmasıyla oluşur.",
      range: "Haftada 150 dk orta veya 75 dk yoğun egzersiz + haftada 2 gün kas güçlendirme genel öneridir.",
      up: "Antrenman yaptın.",
      down: "Egzersiz yapmadın ya da kaydedilmedi.",
      affects: "Otomatik algılama her sporu yakalamaz; ağırlık antrenmanını elle başlatmak daha doğru sonuç verir.",
      tip: "Egzersizi saatten başlatırsan nabız ve kalori verisi çok daha detaylı olur.",
    },
  },

  /* ---------------- Uyku ---------------- */
  {
    id: "sleep", label: "Uyku süresi", group: "sleep", type: "sleep", unit: "sa", d: 1, core: true, higher: "good",
    keys: [/minutesasleep/i, /asleep.*(_s|min)/i, /^total_minutes$/], conv: secToH,
    info: {
      what: "Gece (ve varsa gündüz şekerlemeleri dahil) gerçekten uyuduğun toplam süre. Yatakta uyanık geçen süre mümkün olduğunca düşülür.",
      how: "Cihaz hareketin durmasını ve nabzın düşmesini izleyerek uykuya daldığını, kalp atış ritmindeki değişimlerle de uyku evrelerini tahmin eder. Sabah telefonla senkron olunca veri gelir.",
      range: "Yetişkinler için önerilen 7–9 saat. 6 saatin altı düzenli olursa gün içi performans ve toparlanma belirgin şekilde etkilenir.",
      up: "Daha uzun dinlendin; borç uykuyu kapatıyor olabilirsin.",
      down: "Geç yatış, erken kalkış, bölünmüş uyku. Bir gece sorun değil, birkaç gece üst üste düşükse dikkat.",
      affects: "Kafein (özellikle öğleden sonra), alkol, geç yemek, ekran ışığı, stres, oda sıcaklığı, düzensiz yatış saati.",
      tip: "Her gün aynı saatte kalkmak (hafta sonu dahil), uyku süresini artırmanın en etkili yoludur.",
    },
  },
  {
    id: "sleep_deep", label: "Derin uyku", group: "sleep", type: "sleep", unit: "dk", d: 0, higher: "good",
    keys: [/stages\.deep_min/],
    info: {
      what: "Vücudun fiziksel olarak en çok toparlandığı evre: kas onarımı, bağışıklık ve büyüme hormonu salgısı bu evrede yoğunlaşır.",
      how: "Nabzın en düşük ve en düzenli olduğu, neredeyse hiç hareket olmayan dönemler derin uyku olarak tahmin edilir.",
      range: "Toplam uykunun yaklaşık %13–23'ü; çoğu yetişkinde gecede 45–90 dakika. Yaşla birlikte azalır.",
      up: "Fiziksel toparlanma için iyi bir gece.",
      down: "Alkol, geç saatte ağır egzersiz veya yemek, sıcak oda derin uykuyu azaltabilir.",
      affects: "Alkol, oda sıcaklığı, gün içindeki fiziksel aktivite, yaş.",
      tip: "Serin (18–20 °C) ve karanlık bir oda derin uykuyu destekler.",
    },
  },
  {
    id: "sleep_rem", label: "REM uykusu", group: "sleep", type: "sleep", unit: "dk", d: 0, higher: "good",
    keys: [/stages\.rem_min/],
    info: {
      what: "Rüyaların çoğunun görüldüğü evre. Hafıza, öğrenme ve duygusal denge için önemlidir.",
      how: "Nabzın ve solunumun düzensizleştiği ama vücudun hareketsiz kaldığı dönemlerden tahmin edilir.",
      range: "Toplam uykunun yaklaşık %20–25'i; gecede 90–120 dakika civarı. Çoğunlukla gecenin ikinci yarısında olur.",
      up: "Zihinsel toparlanma için iyi.",
      down: "Kısa uyku (özellikle erken kalkış) ve alkol REM'i en çok kısan etkenlerdir.",
      affects: "Uyku süresi, alkol, bazı ilaçlar, stres.",
      tip: "REM gecenin sonuna yığıldığı için, alarmı 30 dk erkene kurmak en çok REM'den çalar.",
    },
  },
  {
    id: "sleep_light", label: "Hafif uyku", group: "sleep", type: "sleep", unit: "dk", d: 0, higher: "neutral",
    keys: [/stages\.light_min/],
    info: {
      what: "Uykunun en büyük bölümünü oluşturan geçiş evresi. Vücut gevşer, nabız ve vücut ısısı düşer; hafıza pekiştirme burada da sürer.",
      how: "Hareketin az olduğu ama nabzın derin uykudaki kadar düşmediği dönemlerden tahmin edilir.",
      range: "Toplam uykunun yaklaşık %50–60'ı; çoğu yetişkinde gecede 3–4,5 saat.",
      up: "Uzun bir gecenin doğal sonucu olabilir; tek başına iyi ya da kötü değildir.",
      down: "Kısa uykuda hafif uyku da azalır.",
      affects: "Toplam uyku süresi, gürültü, ışık.",
      tip: "Hafif uyku kötü uyku demek değildir; asıl derin ve REM uykusunun yeterli olup olmadığına bak.",
    },
  },
  {
    id: "sleep_awake", label: "Uykuda uyanık kalma", group: "sleep", type: "sleep", unit: "dk", d: 0, higher: "bad",
    keys: [/stages\.awake_min/, /minutesAwake/i],
    info: {
      what: "Gece boyunca kısa uyanmalarda geçen toplam süre. Çoğunu sabah hatırlamazsın.",
      how: "Hareketin ve nabzın kısa süreliğine uyanıklık düzeyine çıktığı anlar toplanır.",
      range: "Gecede 10–30 dakika ve birkaç kısa uyanma tamamen normaldir.",
      up: "Bölünmüş uyku: gürültü, sıcak oda, geç alkol/kafein, stres veya tuvalet ihtiyacı.",
      down: "Daha kesintisiz bir gece.",
      affects: "Oda sıcaklığı, alkol, kafein, stres, partner veya evcil hayvan, geç sıvı tüketimi.",
      tip: "Yatmadan 2–3 saat önce alkol ve bol sıvıyı kesmek gece uyanmalarını azaltır.",
    },
  },
  {
    id: "resp", label: "Solunum hızı", group: "sleep", type: "daily-respiratory-rate", unit: "nefes/dk", d: 1, higher: "neutral",
    keys: [/breath/i, /rate/i, /avg|average|mean/i, /.*/],
    info: {
      what: "Uyurken dakikada ortalama kaç kez nefes aldığın.",
      how: "Nefes alıp verirken kalp atış aralıkları hafifçe değişir; cihaz bu dalgalanmadan solunum hızını çıkarır. Sadece uykuda, hareketsizken ölçülür.",
      range: "Sağlıklı yetişkinlerde uykuda genellikle 12–20 nefes/dk. Önemli olan kendi normalin: çoğu kişide her gece birbirine çok yakındır.",
      up: "Kendi normalinin belirgin üstüne çıkması (ör. +2–3) hastalık başlangıcı, ateş, alkol veya yoğun antrenman sonrası görülebilir.",
      down: "Genelde rahat ve derin uykuyla ilişkilidir.",
      affects: "Hastalık, ateş, alkol, yükseklik, akciğer/nefes yolu rahatsızlıkları.",
      tip: "Birkaç gece üst üste yüksek seyrederse ve kendini hasta hissediyorsan dinlenmeye öncelik ver; uzun sürerse doktora danış.",
    },
  },
  {
    id: "spo2", label: "Oksijen satürasyonu (SpO₂)", group: "sleep", type: "daily-oxygen-saturation", unit: "%", d: 1, higher: "good",
    keys: [/avg|average|mean/i, /percent/i, /.*/],
    info: {
      what: "Kanındaki hemoglobinin ne kadarının oksijen taşıdığı, uyku boyunca ortalama.",
      how: "Saatin arkasındaki kırmızı ve kızılötesi ışık, kandaki oksijenli/oksijensiz hemoglobinin ışığı farklı emmesinden yüzdeyi tahmin eder.",
      range: "Uykuda tipik olarak %95–100. Uykuda kısa düşüşler normaldir. Ortalamanın düzenli olarak %90'ın altında olması doktora danışmayı gerektirir.",
      up: "Normal aralıkta küçük farklar önemsizdir.",
      down: "Yükseklik, soğuk algınlığı, nefes yolu tıkanıklığı; düzenli düşüşler uyku apnesi gibi durumların işareti olabilir.",
      affects: "Bilekliğin sıkılığı, cilt tonu ve dövmeler, soğuk eller, yükseklik.",
      tip: "Bileklik ölçümü tıbbi bir oksimetre değildir; trend olarak takip et.",
    },
  },
  {
    id: "skin_temp", label: "Cilt sıcaklığı değişimi", group: "sleep", type: "daily-sleep-temperature-derivations", unit: "°C", d: 1, signed: true, higher: "neutral",
    keys: [/relativeNightly(?!Stddev)/i, /deviation|delta|diff/i],
    compute: (m) => (m.nightlyTemperatureCelsius != null && m.baselineTemperatureCelsius != null ? m.nightlyTemperatureCelsius - m.baselineTemperatureCelsius : undefined),
    info: {
      what: "Uyurken ölçülen cilt sıcaklığının, senin kişisel ortalamandan ne kadar saptığı. Mutlak sıcaklık değil, farktır.",
      how: "Saatin sıcaklık sensörü gece boyunca ölçüm yapar; son haftalardaki ortalamanla karşılaştırılır.",
      range: "Çoğu gece ±0,5 °C içinde kalır. ±1 °C üzeri sapmalar dikkat çekicidir.",
      up: "Hastalık başlangıcı (vücut ısısı yükselmeden önce bile), sıcak oda, alkol, kadınlarda adet döngüsünün ikinci yarısı.",
      down: "Serin oda, ince örtü veya soğuk ortam.",
      affects: "Oda sıcaklığı, yorgan, alkol, hastalık, hormonal döngü.",
      tip: "Sıcaklık artışı + dinlenme nabzı artışı + düşük HRV birlikte görülüyorsa vücudun bir şeyle uğraşıyor olabilir; o gün yüklenme.",
    },
  },

  /* ---------------- Kalp ve toparlanma ---------------- */
  {
    id: "rhr", label: "Dinlenme nabzı", group: "heart", type: "daily-resting-heart-rate", unit: "bpm", d: 0, core: true, higher: "bad",
    keys: [/beatsperminute/i, /bpm/i, /rate/i, /.*/],
    info: {
      what: "Tamamen dinlenik haldeyken kalbinin dakikada kaç kez attığı. Kondisyonun ve toparlanmanın en güvenilir göstergelerinden biri.",
      how: "Ağırlıklı olarak uykudaki ve hareketsiz anlardaki nabız ölçümlerinden günlük tek bir değer hesaplanır.",
      range: "Yetişkinlerde 60–100 bpm normal kabul edilir; düzenli egzersiz yapanlarda 40–60 da olağandır. Asıl önemli olan kendi normaline göre değişim.",
      up: "Kendi ortalamanın 5+ bpm üstü: kötü uyku, stres, alkol, susuzluk, yoğun antrenman sonrası yorgunluk veya hastalık başlangıcı olabilir.",
      down: "Haftalar içinde yavaş düşüş, kondisyonun arttığını gösterir.",
      affects: "Uyku, alkol, kafein, stres, sıcak hava, hastalık, antrenman yükü, bazı ilaçlar.",
      tip: "Birkaç gün üst üste yüksekse o hafta yoğunluğu azaltıp uykuya öncelik ver. Haftalarca belirgin yüksek kalırsa doktora danış.",
    },
  },
  {
    id: "hrv", label: "Kalp atış hızı değişkenliği (HRV)", group: "heart", type: "daily-heart-rate-variability", unit: "ms", d: 0, core: true, higher: "good",
    keys: [/averageHeartRateVariability/i, /rmssd|rootMeanSquare/i, /millis/i, /.*/],
    info: {
      what: "Ardışık kalp atışları arasındaki sürenin ne kadar değiştiği. Kalp metronom gibi atmaz; atışlar arası sürenin esnek olması, sinir sisteminin 'dinlen ve toparlan' modunda olduğunu gösterir.",
      how: "Derin uyku sırasında atımlar arası süreler milisaniye hassasiyetle ölçülür ve RMSSD denen yöntemle tek bir değere çevrilir.",
      range: "Çok kişisel bir değerdir: yetişkinlerde 20 ms'den 100 ms'nin üstüne kadar normal olabilir ve yaşla azalır. Başkasıyla değil, kendi ortalamanla karşılaştır.",
      up: "Kendi normalinin üstü: iyi toparlanmışsın, stres düşük. Antrenman için iyi bir gün.",
      down: "Kendi normalinin belirgin altı: yorgunluk, stres, kötü uyku, alkol veya hastalık. Vücut hâlâ toparlanıyor olabilir.",
      affects: "Alkol (en güçlü etkenlerden), uyku kalitesi, stres, yoğun antrenman, hastalık, geç yemek.",
      tip: "Tek gecelik düşüşü değil, 7 günlük eğilimi takip et. Akşam alkolü HRV'yi o gece ciddi düşürür.",
    },
  },
  {
    id: "hr_avg", label: "Ortalama nabız", group: "heart", type: "heart-rate", unit: "bpm", d: 0, higher: "neutral",
    keys: [/avg|average|mean/i, /bpm/i, /.*/],
    info: {
      what: "Gün boyunca (aktivite dahil) ölçülen nabzın ortalaması.",
      how: "Saatin optik sensörü gün boyu nabzını ölçer; günlük ortalaması alınır.",
      range: "Genelde dinlenme nabzının 10–25 bpm üstündedir; aktif günlerde daha yüksektir.",
      up: "Hareketli gün, sıcak hava, stres veya kafein.",
      down: "Sakin bir gün.",
      affects: "Aktivite, stres, kafein, sıcaklık.",
      tip: "Toparlanmayı anlamak için ortalama nabızdan çok dinlenme nabzına bak.",
    },
  },
  {
    id: "vo2max", label: "Kardiyo kondisyonu (VO₂ max)", group: "heart", type: "daily-vo2-max", unit: "ml/kg/dk", d: 0, higher: "good",
    keys: [/^vo2Max$/i, /vo2max(?!cov)/i, /.*/],
    info: {
      what: "Vücudunun eforda kullanabildiği en yüksek oksijen miktarının tahmini. Genel kondisyonun ve uzun vadeli sağlığın güçlü bir göstergesi.",
      how: "Dinlenme nabzın, yaşın, kilon ve özellikle GPS'li koşu/yürüyüşlerdeki hız-nabız ilişkinden tahmin edilir.",
      range: "Yaşa ve cinsiyete göre değişir. Kabaca 30–40 yaş için erkeklerde 40+, kadınlarda 35+ 'iyi' sayılır. Yaşla yavaşça düşer.",
      up: "Kondisyonun artıyor; düzenli kardiyonun sonucu.",
      down: "Uzun süre egzersize ara, kilo artışı veya hastalık sonrası görülebilir.",
      affects: "Düzenli kardiyo (en büyük etken), kilo, yaş, genetik.",
      tip: "Haftada 1–2 kez kısa, nefes nefese bırakan aralıklı antrenman VO₂ max'ı en hızlı artıran yöntemdir.",
    },
  },

  /* ---------------- Vücut ---------------- */
  {
    id: "weight", label: "Kilo", group: "body", type: "weight", unit: "kg", d: 1, higher: "neutral",
    keys: [/kilogram/i, /gram/i, /avg|average|weight/i, /.*/],
    conv: (k, v) => (/kilogram/i.test(k) ? v : /gram/i.test(k) ? v / 1000 : v > 500 ? v / 1000 : v),
    info: {
      what: "Kaydedilen vücut ağırlığın (akıllı tartı veya elle giriş).",
      how: "Bağlı akıllı tartıdan ya da Google Health/Fitbit uygulamasına elle girdiğin değerden gelir.",
      range: "Sağlıklı aralık boyuna göre değişir; tek başına bir 'iyi/kötü' sayısı yoktur.",
      up: "Günlük 0,5–1,5 kg dalgalanma çoğunlukla su, tuz ve sindirimdendir, yağ değildir.",
      down: "Aynı şekilde, tek günlük düşüşler çoğunlukla sudur.",
      affects: "Su tüketimi, tuz, karbonhidrat, tartılma saati, egzersiz.",
      tip: "Her gün aynı saatte (sabah, tuvaletten sonra) tartıl ve haftalık ortalamaya bak.",
    },
  },
  {
    id: "body_fat", label: "Vücut yağ oranı", group: "body", type: "body-fat", unit: "%", d: 1, higher: "neutral",
    keys: [/percent/i, /avg|average/i, /.*/],
    info: {
      what: "Vücut ağırlığının yüzde kaçının yağ olduğu tahmini.",
      how: "Akıllı tartılar vücuttan zayıf bir elektrik akımı geçirip direnci ölçer (biyoelektrik empedans).",
      range: "Kabaca erkeklerde %10–20, kadınlarda %18–28 sağlıklı aralık kabul edilir; yaşa göre değişir.",
      up: "Uzun vadede artış yağ kazanımını gösterebilir, ama günlük değerler gürültülüdür.",
      down: "Uzun vadede düşüş yağ kaybını gösterebilir.",
      affects: "Su durumu (en büyük etken), yemek, egzersiz sonrası ölçüm.",
      tip: "Tartı tahminleri ±%3–5 hata payı taşır; haftalar içindeki eğilime bak.",
    },
  },

  /* ---------------- Kayıtlar ---------------- */
  {
    id: "hydration", label: "Su", group: "logs", type: "hydration-log", unit: "ml", d: 0, higher: "good",
    keys: [/millilit/i, /lit/i, /volume|amount|sum/i, /.*/],
    conv: (k, v) => (/millilit/i.test(k) ? v : /lit/i.test(k) ? v * 1000 : v),
    info: {
      what: "Uygulamaya kaydettiğin su miktarı.",
      how: "Sadece elle girdiğin kayıtlardan gelir; otomatik ölçülmez.",
      range: "Genel öneri günde 1,5–2,5 litre sıvı (yemeklerdeki su hariç); sıcak havada ve egzersizde artar.",
      up: "Daha çok su içtin (veya daha düzenli kaydettin).",
      down: "Az içtin ya da kaydetmeyi unuttun.",
      affects: "Kayıt alışkanlığı.",
      tip: "İdrar renginin açık sarı olması yeterli su içtiğinin pratik bir işaretidir.",
    },
  },
  {
    id: "nutrition", label: "Alınan kalori", group: "logs", type: "nutrition-log", unit: "kcal", d: 0, higher: "neutral",
    keys: [/kcal/i, /kilocal/i, /calor/i, /energy/i, /.*/],
    info: {
      what: "Uygulamaya kaydettiğin yiyeceklerin toplam kalorisi.",
      how: "Sadece elle girdiğin yemek kayıtlarından gelir.",
      range: "İhtiyaç kişiye göre değişir; 'Toplam kalori' ile karşılaştırmak enerji dengesini gösterir.",
      up: "Daha çok yedin ya da daha eksiksiz kaydettin.",
      down: "Daha az yedin ya da bazı öğünleri kaydetmedin.",
      affects: "Kayıt eksiksizliği.",
      tip: "Kayıtlar eksikse yorumlar da eksik olur; birkaç gün düzenli kaydetmek bile fikir verir.",
    },
  },
  {
    id: "ecg", label: "EKG kayıtları", group: "logs", type: "electrocardiogram", unit: "kayıt", d: 0, countOnly: true, higher: "neutral",
    keys: [/^count$/],
    info: {
      what: "Saatinle elle başlattığın 30 saniyelik EKG ölçümleri.",
      how: "Parmağını saatin kenarına değdirdiğinde kalbin elektriksel aktivitesi kaydedilir ve atriyal fibrilasyon (AFib) belirtisi olup olmadığı değerlendirilir.",
      range: "Sonuçlar genelde 'Normal sinüs ritmi', 'AFib belirtisi' veya 'Sonuçsuz' olarak gelir.",
      up: "Daha sık ölçüm aldın.",
      down: "—",
      affects: "Ölçüm sırasında hareket etmek veya kolu masaya dayamamak sonucu 'sonuçsuz' yapabilir.",
      tip: "FitMyBit EKG'yi yorumlamaz; 'AFib' veya tekrar eden 'sonuçsuz' sonuçlarda doktoruna danış.",
    },
  },
  {
    id: "irn", label: "Düzensiz ritim bildirimleri", group: "logs", type: "irregular-rhythm-notification", unit: "bildirim", d: 0, countOnly: true, higher: "bad",
    keys: [/^count$/],
    info: {
      what: "Saatin arka planda kalp ritmini izlerken AFib ile uyumlu düzensiz bir ritim fark ettiğinde gönderdiği bildirimler.",
      how: "Özellikle uykuda ve hareketsizken nabız ritmi analiz edilir; tekrarlayan düzensizlik saptanırsa bildirim oluşur.",
      range: "Çoğu kişide hiç bildirim olmaz.",
      up: "Bir bildirim aldıysan bu bir teşhis değildir ama mutlaka doktorunla paylaşmalısın.",
      down: "—",
      affects: "Özelliğin cihazında açık olması gerekir.",
      tip: "Bildirim aldıysan tarihini not al ve bir kardiyoloğa danış.",
    },
  },
  {
    id: "cycle", label: "Adet döngüsü", group: "logs", type: "menstrual-period", unit: "gün", d: 0, countOnly: true, higher: "neutral",
    keys: [/^count$/],
    info: {
      what: "Kaydettiğin adet dönemleri.",
      how: "Uygulamaya elle girdiğin kayıtlardan gelir.",
      range: "Döngü uzunluğu genelde 21–35 gün, adet süresi 2–7 gündür.",
      up: "—", down: "—",
      affects: "Döngü evreleri cilt sıcaklığını, dinlenme nabzını ve HRV'yi etkileyebilir; yorumlarda bu dikkate alınır.",
      tip: "Düzenli kayıt, diğer metriklerdeki dalgalanmaları anlamayı kolaylaştırır.",
    },
  },
  {
    id: "mood", label: "Ruh hali kayıtları", group: "logs", type: "moods", unit: "kayıt", d: 0, countOnly: true, higher: "neutral",
    keys: [/^count$/],
    info: {
      what: "Uygulamaya girdiğin ruh hali/farkındalık kayıtları.",
      how: "Elle girilir.",
      range: "—", up: "—", down: "—",
      affects: "Uyku, stres ve aktiviteyle ilişkisini görmek için kullanışlıdır.",
      tip: "Kötü hissettiğin günleri uyku ve HRV ile karşılaştır; çoğu zaman bir bağlantı çıkar.",
    },
  },
  {
    id: "symptoms", label: "Semptom kayıtları", group: "logs", type: "symptoms", unit: "kayıt", d: 0, countOnly: true, higher: "neutral",
    keys: [/^count$/],
    info: {
      what: "Kaydettiğin semptomlar (baş ağrısı, yorgunluk vb.).",
      how: "Elle girilir.",
      range: "—", up: "—", down: "—",
      affects: "Diğer metriklerle birlikte değerlendirilir.",
      tip: "Semptomlar devam ederse veriler yerine bir sağlık profesyoneline başvur.",
    },
  },
];
