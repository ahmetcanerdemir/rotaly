"use client";

import { useState } from "react";

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
  "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye",
  "Düzce",
];

export default function CalculatorPage() {
  const [step, setStep] = useState(1);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl bg-slate-900 rounded-3xl p-10 shadow-2xl">
        <p className="text-blue-400 font-semibold mb-2">Adım {step} / 6</p>

        {step === 1 && (
          <>
            <h1 className="text-4xl font-bold mb-3">Nereden çıkıyorsunuz?</h1>
            <p className="text-gray-400 mb-6">
              Seyahatinizin başlangıç şehrini seçin.
            </p>

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
                fromCity
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-slate-700 cursor-not-allowed text-gray-400"
              }`}
            >
              Devam →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-4xl font-bold mb-3">Nereye gidiyorsunuz?</h1>
            <p className="text-gray-400 mb-6">
              Başlangıç şehriniz: {fromCity}
            </p>

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
                toCity
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-slate-700 cursor-not-allowed text-gray-400"
              }`}
            >
              Devam →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-4xl font-bold mb-3">Rota hazır!</h1>
            <p className="text-gray-400 mb-8">
              {fromCity} → {toCity}
            </p>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl py-4 font-semibold text-lg transition"
            >
              Başa Dön
            </button>
          </>
        )}

        <div className="mt-10">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>İlerleme</span>
            <span>%{Math.round((step / 6) * 100)}</span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800">
            <div
              className="h-3 rounded-full bg-blue-500 transition-all"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}