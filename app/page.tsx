import Link from "next/link";

const stats = [
  { icon: "🗺️", label: "81 şehir" },
  { icon: "⛽", label: "Araç bazlı yakıt hesabı" },
  { icon: "💰", label: "Tahmini toplam bütçe" },
];

const features = [
  {
    icon: "🗺️",
    title: "Rota planlama",
    description: "Başlangıç ve varış şehrini seç, mesafe otomatik hesaplansın.",
  },
  {
    icon: "⛽",
    title: "Araç ve yakıt hesabı",
    description: "Aracını seç, yakıt tipine göre gerçekçi maliyet gör.",
  },
  {
    icon: "🏨",
    title: "Konaklama bütçesi",
    description: "Kişi ve gün sayısına göre konaklama tahmini oluşturulur.",
  },
  {
    icon: "🍽️",
    title: "Günlük harcamalar",
    description: "Yemek ve aktivite giderlerini bütçene dahil et.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-16 pt-20 text-center">
        <div className="mb-8 flex flex-col items-center gap-1">
          <span className="text-lg font-bold tracking-tight text-blue-400">
            Rotaly
          </span>
          <span className="text-sm text-gray-500">
            Akıllı Seyahat Bütçe Planlayıcısı
          </span>
        </div>

        <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          Tatile çıkmadan önce gerçek maliyetini öğren.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl">
          Rotaly; rota, araç, konaklama ve günlük harcamaları bir araya
          getirerek seyahat bütçeni dakikalar içinde tahmin eder.
        </p>

        <Link
          href="/calculator"
          className="mt-10 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold transition hover:bg-blue-700"
        >
          Hesaplamaya Başla
        </Link>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-700 bg-slate-900 p-5"
            >
              <p className="text-2xl">{stat.icon}</p>
              <p className="mt-2 font-semibold text-gray-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">
          Bütçeni nasıl hesaplıyoruz?
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <p className="text-3xl">{feature.icon}</p>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="px-6 pb-12 text-center text-sm text-gray-500">
        Şu an geliştirme aşamasında. Hesaplamalar tahmini değerlerle
        oluşturulur.
      </p>
    </main>
  );
}
