"use client";

import { useState } from "react";
import ProgressBar from "../../components/ProgressBar";

const cities = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya",
  "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
  "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum",
  "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
  "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir",
  "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa",
  "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Rize", "Sakarya", "Samsun",
  "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van",
  "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan",
  "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce",
];

const transports = [
  { id: "car", label: "Kendi Aracım", emoji: "🚗" },
  { id: "plane", label: "Uçak", emoji: "✈️" },
  { id: "bus", label: "Otobüs", emoji: "🚌" },
  { id: "train", label: "Tren", emoji: "🚆" },
];

export default function CalculatorPage() {
  const [step, setStep] = useState(1);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [transport, setTransport] = useState("");
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(5);

  const estimatedTotal = people * days * 2500;

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl bg-slate-900 rounded-3xl p-10 shadow-2xl">
        <p className="text-blue-400 font-semibold mb-2">Adım {step} / 6</p>

        {step === 1 && (
          <>
            <h1 className="text-4xl font-bold mb-3">Nereden çıkıyorsunuz?</h1>
            <p className="text-gray-400 mb-6">Başlangıç şehrinizi seçin.</p>

            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setFromCity(city)}
                  className={`rounded-xl border p-3 transition ${
                    fromCity === city
                      ? "bg-blue-600 border-blue-600"
                      : "bg-slate-800 border-slate-700 hover:border-blue-500"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!fromCity}
              className={`mt-8 w-full rounded-xl py-4 font-semibold text-lg transition ${
                fromCity ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 cursor-not-allowed text-gray-400"
              }`}
            >
              Devam →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-4xl font-bold mb-3">Nereye gidiyorsunuz?</h1>
            <p className="text-gray-400 mb-6">Başlangıç: {fromCity}</p>

            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setToCity(city)}
                  disabled={city === fromCity}
                  className={`rounded-xl border p-3 transition ${
                    toCity === city
                      ? "bg-blue-600 border-blue-600"
                      : city === fromCity
                      ? "bg-slate-800 border-slate-800 text-gray-600 cursor-not-allowed"
                      : "bg-slate-800 border-slate-700 hover:border-blue-500"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!toCity}
              className={`mt-8 w-full rounded-xl py-4 font-semibold text-lg transition ${
                toCity ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 cursor-not-allowed text-gray-400"
              }`}
            >
              Devam →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-4xl font-bold mb-3">Nasıl gideceksiniz?</h1>
            <p className="text-gray-400 mb-6">{fromCity} → {toCity}</p>

            <div className="grid grid-cols-2 gap-4">
              {transports.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTransport(item.id)}
                  className={`rounded-2xl border p-6 transition ${
                    transport === item.id
                      ? "bg-blue-600 border-blue-600"
                      : "bg-slate-800 border-slate-700 hover:border-blue-500"
                  }`}
                >
                  <div className="text-4xl mb-3">{item.emoji}</div>
                  <div className="font-semibold">{item.label}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!transport}
              className={`mt-8 w-full rounded-xl py-4 font-semibold text-lg transition ${
                transport ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 cursor-not-allowed text-gray-400"
              }`}
            >
              Devam →
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-4xl font-bold mb-3">Kaç kişisiniz?</h1>
            <p className="text-gray-400 mb-6">Kişi sayısını seçin.</p>

            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((number) => (
                <button
                  key={number}
                  onClick={() => setPeople(number)}
                  className={`rounded-xl border p-5 text-xl font-bold transition ${
                    people === number
                      ? "bg-blue-600 border-blue-600"
                      : "bg-slate-800 border-slate-700 hover:border-blue-500"
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(5)}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-4 font-semibold text-lg transition"
            >
              Devam →
            </button>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="text-4xl font-bold mb-3">Kaç gün kalacaksınız?</h1>
            <p className="text-gray-400 mb-6">Tatil süresini seçin.</p>

            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 5, 7, 10, 14, 21].map((number) => (
                <button
                  key={number}
                  onClick={() => setDays(number)}
                  className={`rounded-xl border p-5 text-xl font-bold transition ${
                    days === number
                      ? "bg-blue-600 border-blue-600"
                      : "bg-slate-800 border-slate-700 hover:border-blue-500"
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(6)}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-4 font-semibold text-lg transition"
            >
              Sonucu Gör →
            </button>
          </>
        )}

        {step === 6 && (
          <>
            <h1 className="text-4xl font-bold mb-3">Tahmini Tatil Maliyeti</h1>
            <p className="text-gray-400 mb-8">
              {fromCity} → {toCity} · {people} kişi · {days} gün
            </p>

            <div className="rounded-2xl bg-slate-800 p-6 mb-6">
              <p className="text-gray-400 mb-2">Toplam Tahmini Bütçe</p>
              <p className="text-5xl font-bold text-blue-400">
                ₺{estimatedTotal.toLocaleString("tr-TR")}
              </p>
            </div>

            <div className="space-y-3 text-gray-300">
              <div className="flex justify-between">
                <span>🏨 Konaklama</span>
                <span>₺{(days * people * 1200).toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between">
                <span>🍽️ Yemek</span>
                <span>₺{(days * people * 700).toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between">
                <span>🎯 Aktivite</span>
                <span>₺{(days * people * 600).toLocaleString("tr-TR")}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setFromCity("");
                setToCity("");
                setTransport("");
                setPeople(2);
                setDays(5);
              }}
              className="mt-8 w-full bg-slate-800 hover:bg-slate-700 rounded-xl py-4 font-semibold text-lg transition"
            >
              Yeni Hesaplama Yap
            </button>
          </>
        )}

        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mt-6 w-full text-gray-400 hover:text-white transition"
          >
            ← Geri
          </button>
        )}

        <ProgressBar step={step} totalSteps={6} />
      </div>
    </main>
  )
