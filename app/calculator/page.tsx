"use client";

import { useState } from "react";

export default function CalculatorPage() {
  const [step, setStep] = useState(1);
  const [fromCity, setFromCity] = useState("");

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl bg-slate-900 rounded-3xl p-10 shadow-2xl">
        <p className="text-blue-400 font-semibold mb-2">
          Adım {step} / 6
        </p>

        {step === 1 && (
          <>
            <h1 className="text-4xl font-bold mb-3">
              Nereden çıkıyorsunuz?
            </h1>

            <p className="text-gray-400 mb-8">
              Seyahatinizin başlangıç şehrini yazın.
            </p>

            <input
              type="text"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              placeholder="İstanbul"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-4 text-lg outline-none focus:border-blue-500"
            />

            <button
              onClick={() => setStep(2)}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-4 font-semibold text-lg transition"
            >
              Devam →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-4xl font-bold mb-3">
              Nereye gidiyorsunuz?
            </h1>

            <p className="text-gray-400 mb-8">
              Başlangıç şehriniz: {fromCity || "Belirtilmedi"}
            </p>

            <input
              type="text"
              placeholder="Antalya"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-4 text-lg outline-none focus:border-blue-500"
            />

            <button
              onClick={() => setStep(3)}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-4 font-semibold text-lg transition"
            >
              Devam →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-4xl font-bold mb-3">
              Harika başlangıç!
            </h1>

            <p className="text-gray-400 mb-8">
              İlk çok adımlı hesaplayıcı ekranımız çalışıyor.
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