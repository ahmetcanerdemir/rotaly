"use client";

export type RouteHighlight = "withTolls" | "noTolls";

type Props = {
  active: RouteHighlight;
  onChange: (value: RouteHighlight) => void;
};

// Desktop'ta haritadaki vurgulamayı, mobilde ise sekme/segment kontrolünü
// aynı bileşen üstlenir (bkz. docs/feature-akilli-rota-karsilastirmasi.md
// Bölüm 5).
export default function RouteComparisonToggle({ active, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange("withTolls")}
        className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
          active === "withTolls"
            ? "bg-blue-600 border-blue-600"
            : "bg-slate-800 border-slate-700 text-gray-300 hover:border-blue-500"
        }`}
      >
        🔵 Otoyollu
      </button>
      <button
        onClick={() => onChange("noTolls")}
        className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
          active === "noTolls"
            ? "bg-green-600 border-green-600"
            : "bg-slate-800 border-slate-700 text-gray-300 hover:border-green-500"
        }`}
      >
        🟢 Otoyolsuz
      </button>
    </div>
  );
}
