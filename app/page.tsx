import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-6xl font-bold mb-6">Rotaly</h1>

      <p className="text-xl text-gray-300 text-center max-w-xl mb-10">
        Tatilinin gerçek maliyetini önceden öğren.
      </p>

      <Link
        href="/calculator"
        className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-lg font-semibold transition"
      >
        Hesaplamaya Başla
      </Link>

      <div className="mt-16 grid grid-cols-2 gap-4 text-gray-400">
        <span>🚗 Yakıt</span>
        <span>🛣️ HGS</span>
        <span>🏨 Konaklama</span>
        <span>🍽️ Yemek</span>
        <span>🚙 Otopark</span>
        <span>💰 Toplam Bütçe</span>
      </div>
    </main>
  );
}