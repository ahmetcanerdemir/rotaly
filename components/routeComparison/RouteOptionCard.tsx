import type { RouteOptionWithCost } from "../../lib/maps/routeComparison/compareRoutes";

type Props = {
  label: string;
  icon: string;
  option: RouteOptionWithCost;
  isSelected: boolean;
  onSelect: () => void;
};

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours <= 0) {
    return `${minutes} dk`;
  }

  return minutes > 0 ? `${hours} saat ${minutes} dk` : `${hours} saat`;
}

function confidenceLabel(confidence?: "verified" | "aggregator"): string {
  return confidence === "aggregator" ? "KGM tarifesi" : "resmi";
}

export default function RouteOptionCard({
  label,
  icon,
  option,
  isSelected,
  onSelect,
}: Props) {
  const { route, trip, tollSource, tollBreakdown, tollConfidence } = option;
  const badge = confidenceLabel(tollConfidence);

  return (
    <div
      className={`rounded-2xl border p-5 transition ${
        isSelected
          ? "bg-slate-800 border-blue-500"
          : "bg-slate-800/60 border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold">
          {icon} {label}
        </span>
        {isSelected && (
          <span className="text-xs font-semibold text-blue-400">Seçili</span>
        )}
      </div>

      <div className="text-sm text-gray-400 mb-4">
        📍 {route.distanceKm} km &nbsp;·&nbsp; ⏱️ {formatDuration(route.durationMinutes)}
      </div>

      <div className="space-y-2 text-sm text-gray-300 mb-4">
        <div className="flex justify-between">
          <span>⛽ Yakıt</span>
          <span>₺{trip.breakdown.fuel.totalCost.toLocaleString("tr-TR")}</span>
        </div>
        {tollSource === "official" && tollBreakdown && tollBreakdown.bridgeFee > 0 ? (
          <>
            <div className="flex justify-between">
              <span>
                🌉 Köprü Ücreti
                <span className="ml-1 text-xs text-blue-400">({badge})</span>
              </span>
              <span>
                ₺{tollBreakdown.bridgeFee.toLocaleString("tr-TR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                🛣️ Otoyol Ücreti
                <span className="ml-1 text-xs text-blue-400">({badge})</span>
              </span>
              <span>
                ₺{tollBreakdown.highwayFee.toLocaleString("tr-TR")}
              </span>
            </div>
          </>
        ) : tollSource === "official" ? (
          <div className="flex justify-between">
            <span>
              🛣️ Otoyol
              <span className="ml-1 text-xs text-blue-400">({badge})</span>
            </span>
            <span>₺{trip.breakdown.toll.toLocaleString("tr-TR")}</span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span>🛣️ Otoyol</span>
            <span>₺{trip.breakdown.toll.toLocaleString("tr-TR")}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-white pt-2 border-t border-slate-700">
          <span>Toplam</span>
          <span>₺{trip.totalCost.toLocaleString("tr-TR")}</span>
        </div>
      </div>

      <button
        onClick={onSelect}
        disabled={isSelected}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
          isSelected
            ? "bg-slate-700 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isSelected ? "Bu Rota Seçili" : "Bu Rotayı Seç"}
      </button>
    </div>
  );
}
