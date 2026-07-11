import type { RoutePoint } from "../../lib/maps/routeComparison/routeComparisonTypes";
import type { RouteHighlight } from "./RouteComparisonToggle";

type Props = {
  withTollsPoints: RoutePoint[];
  noTollsPoints: RoutePoint[];
  highlighted: RouteHighlight;
};

function toPolylinePoints(points: RoutePoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

// Basit, bağımlılıksız bir SVG rota görselleştirmesi.
//
// NOT: Bu, gerçek bir etkileşimli harita (Google Maps JavaScript API)
// DEĞİLDİR — bkz. docs/feature-akilli-rota-karsilastirmasi.md Bölüm 5.3.
// Mock/geliştirme aşamasında iki rotanın göreli şeklini ve farkını
// görselleştirmek için kullanılan bir yer tutucudur; gerçek harita
// entegrasyonu (yeni bir bağımlılık kararı gerektirdiği için) ayrı bir
// adım olarak bırakıldı.
export default function RouteComparisonMap({
  withTollsPoints,
  noTollsPoints,
  highlighted,
}: Props) {
  return (
    <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4">
      <svg viewBox="0 0 100 100" className="w-full h-56" preserveAspectRatio="none">
        <polyline
          points={toPolylinePoints(noTollsPoints)}
          fill="none"
          stroke="#4ade80"
          strokeWidth={highlighted === "noTolls" ? 2.2 : 1.2}
          strokeDasharray="4 3"
          strokeLinecap="round"
          opacity={highlighted === "noTolls" ? 1 : 0.4}
        />
        <polyline
          points={toPolylinePoints(withTollsPoints)}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={highlighted === "withTolls" ? 2.2 : 1.2}
          strokeLinecap="round"
          opacity={highlighted === "withTolls" ? 1 : 0.4}
        />
      </svg>
      <div className="flex gap-4 mt-2 text-xs text-gray-400">
        <span>🔵 Otoyollu rota</span>
        <span>🟢 Otoyolsuz rota</span>
      </div>
    </div>
  );
}
