import type { TripCalculationResult } from "../lib/tripCalculator";
import InfoCard from "./InfoCard";

type Props = {
  fromCity: string;
  toCity: string;
  distanceKm: number;
  isCar: boolean;
  transportLabel: string;
  transportIcon: string;
  vehicleLabel: string | null;
  trip: TripCalculationResult;
  /** true ise seyahat gidiş-dönüş olarak hesaplanmıştır. */
  roundTrip?: boolean;
  /** true ise kullanıcı "Otoyollardan Kaçın" tercihini seçmiştir. */
  avoidTolls?: boolean;
  /** HGS kaleminin kürasyonlu resmi tablodan mı yoksa tahmini formülden mi geldiği. */
  tollSource?: "official" | "estimated";
  /** tollSource "official" ise köprü ücretinin otoyol ücretinden ayrı dökümü. */
  tollBreakdown?: { bridgeFee: number; highwayFee: number };
  /** tollSource "official" ise bu rakamın güvenilirlik seviyesi. */
  tollConfidence?: "verified" | "aggregator";
  onReset: () => void;
};

function confidenceLabel(confidence?: "verified" | "aggregator"): string {
  return confidence === "aggregator" ? "KGM tarifesi" : "resmi";
}

export default function TripResultSummary({
  fromCity,
  toCity,
  distanceKm,
  isCar,
  transportLabel,
  transportIcon,
  vehicleLabel,
  trip,
  roundTrip,
  avoidTolls,
  tollSource,
  tollBreakdown,
  tollConfidence,
  onReset,
}: Props) {
  const tollBadge = confidenceLabel(tollConfidence);
  const fuelDisplay = isCar
    ? `₺${trip.breakdown.fuel.totalCost.toLocaleString("tr-TR")}`
    : "Yakıt hesaplanmadı";

  const distanceLabel = roundTrip
    ? `${distanceKm} km (gidiş-dönüş)`
    : `${distanceKm} km`;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Seyahat Bütçen Hazır</h1>
      <p className="text-gray-400 mb-6">
        {fromCity} → {toCity}
      </p>

      <div
        className={`grid grid-cols-1 gap-4 mb-6 ${
          vehicleLabel ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        <InfoCard icon="📍" label="Mesafe" value={distanceLabel} />
        <InfoCard icon={transportIcon} label="Ulaşım" value={transportLabel} />
        {vehicleLabel && (
          <InfoCard icon="🚘" label="Araç" value={vehicleLabel} />
        )}
      </div>

      {isCar && avoidTolls && (
        <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3 mb-6 text-sm text-gray-400">
          🚧 Otoyollardan kaçınıldı — HGS gideri bu nedenle hesaba katılmadı.
        </div>
      )}

      <div className="rounded-2xl bg-slate-800 p-6 md:p-8 mb-6">
        <div className="space-y-3 text-gray-300">
          <div className="flex justify-between">
            <span>⛽ Yakıt</span>
            <span>{fuelDisplay}</span>
          </div>
          {tollSource === "official" && tollBreakdown && tollBreakdown.bridgeFee > 0 ? (
            <>
              <div className="flex justify-between">
                <span>
                  🌉 Köprü Ücreti
                  <span className="ml-1 text-xs text-blue-400">({tollBadge})</span>
                </span>
                <span>
                  ₺{tollBreakdown.bridgeFee.toLocaleString("tr-TR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  🛣️ Otoyol Ücreti
                  <span className="ml-1 text-xs text-blue-400">({tollBadge})</span>
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
                <span className="ml-1 text-xs text-blue-400">({tollBadge})</span>
              </span>
              <span>₺{trip.breakdown.toll.toLocaleString("tr-TR")}</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span>🛣️ Otoyol</span>
              <span>₺{trip.breakdown.toll.toLocaleString("tr-TR")}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>🏨 Konaklama</span>
            <span>₺{trip.breakdown.hotel.toLocaleString("tr-TR")}</span>
          </div>
          <div className="flex justify-between">
            <span>🍽️ Yemek</span>
            <span>₺{trip.breakdown.food.toLocaleString("tr-TR")}</span>
          </div>
          <div className="flex justify-between">
            <span>🎯 Aktivite</span>
            <span>₺{trip.breakdown.activities.toLocaleString("tr-TR")}</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700 flex items-center justify-between">
          <span className="font-semibold text-gray-300">TOPLAM</span>
          <span className="text-4xl md:text-5xl font-bold text-blue-400">
            ₺{trip.totalCost.toLocaleString("tr-TR")}
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3 mb-6 text-sm text-gray-400">
        Bu hesaplama tahmini değerler kullanılarak oluşturulmuştur.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onReset}
          className="rounded-xl bg-slate-800 hover:bg-slate-700 py-4 font-semibold text-lg transition"
        >
          ← Yeni Hesaplama
        </button>

        <button
          disabled
          className="relative rounded-xl bg-slate-800 py-4 font-semibold text-lg text-gray-500 cursor-not-allowed"
        >
          PDF
          <span className="absolute -top-2 -right-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
            Yakında
          </span>
        </button>
      </div>
    </div>
  );
}
