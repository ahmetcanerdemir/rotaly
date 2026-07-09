"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ProgressBar from "../../components/ProgressBar";
import CitySearchInput from "../../components/CitySearchInput";
import VehicleSelector from "../../components/VehicleSelector";
import TripResultSummary from "../../components/TripResultSummary";
import { calculateTrip } from "../../lib/tripCalculator";
import type { FuelType } from "../../lib/costs";
import { getVehicleById } from "../../lib/vehicles";
// TODO: Gerçek Google Maps entegrasyonu bağlandığında `MockMapsProvider`
// yerine `lib/maps.ts`'teki `getMapsService()` (GoogleMapsProvider) kullanılacak.
// `MapsProvider` arayüzü aynı kaldığı için aşağıdaki `fetchDistance` mantığının
// değişmesi gerekmeyecek.
import { MockMapsProvider } from "../../lib/maps";

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

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").trim();
}

function filterCities(cityList: string[], query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return cityList;
  return cityList.filter((city) => normalize(city).includes(normalizedQuery));
}

// TODO: Araç seçilmediğinde kullanılacak varsayılan yakıt tipi.
const MOCK_FUEL_TYPE: FuelType = "gasoline";

const mapsProvider = new MockMapsProvider();

// Adım sırası, ulaşım türüne göre değişir: "car" seçilirse "vehicle" adımı
// devreye girer, aksi halde tamamen atlanır. Bu sayede step numaraları
// sabit kalmak zorunda kalmadan akış dinamik olarak kurulur.
type StepKey =
  | "fromCity"
  | "toCity"
  | "transport"
  | "vehicle"
  | "people"
  | "days"
  | "result";

function getStepSequence(transport: string): StepKey[] {
  const sequence: StepKey[] = ["fromCity", "toCity", "transport"];

  if (transport === "car") {
    sequence.push("vehicle");
  }

  sequence.push("people", "days", "result");
  return sequence;
}

export default function CalculatorPage() {
  const [step, setStep] = useState(1);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [transport, setTransport] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(5);
  const [fromCitySearch, setFromCitySearch] = useState("");
  const [toCitySearch, setToCitySearch] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isDistanceLoading, setIsDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  const stepSequence = useMemo(() => getStepSequence(transport), [transport]);
  const totalSteps = stepSequence.length;
  const currentStepKey = stepSequence[Math.min(step, totalSteps) - 1];

  // Mesafe, hedef şehir seçilir seçilmez (toCity onClick'inde) tetiklenir —
  // bir useEffect yerine doğrudan event handler'dan çağrılır ki state
  // güncellemeleri her zaman taze origin/destination değerleriyle yapılsın.
  // `distanceRequestId`, kullanıcı hızlıca şehir değiştirirse eski (stale)
  // bir cevabın daha yeni bir seçimin üzerine yazmasını engeller.
  const distanceRequestId = useRef(0);

  const invalidateDistance = useCallback(() => {
    distanceRequestId.current += 1;
    setDistanceKm(null);
    setDistanceError(null);
    setIsDistanceLoading(false);
  }, []);

  const fetchDistance = useCallback(async (origin: string, destination: string) => {
    const requestId = ++distanceRequestId.current;
    setIsDistanceLoading(true);
    setDistanceError(null);
    setDistanceKm(null);

    try {
      const result = await mapsProvider.getDistance({ origin, destination });
      if (distanceRequestId.current !== requestId) return;
      setDistanceKm(Math.round(result.distanceMeters / 1000));
    } catch {
      if (distanceRequestId.current !== requestId) return;
      setDistanceError("Mesafe hesaplanamadı. Lütfen tekrar deneyin.");
    } finally {
      if (distanceRequestId.current === requestId) {
        setIsDistanceLoading(false);
      }
    }
  }, []);

  const trip = useMemo(() => {
    if (distanceKm === null) {
      return null;
    }

    return calculateTrip({
      distanceKm,
      fuelType: MOCK_FUEL_TYPE,
      people,
      days,
      vehicleId: transport === "car" && vehicleId ? vehicleId : undefined,
    });
  }, [distanceKm, people, days, transport, vehicleId]);

  const filteredFromCities = useMemo(
    () => filterCities(cities, fromCitySearch),
    [fromCitySearch]
  );

  const filteredToCities = useMemo(
    () => filterCities(cities, toCitySearch),
    [toCitySearch]
  );

  const selectedTransport = useMemo(
    () => transports.find((item) => item.id === transport),
    [transport]
  );

  const vehicleLabel = useMemo(() => {
    if (transport !== "car" || !vehicleId) {
      return null;
    }

    const vehicle = getVehicleById(vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : null;
  }, [transport, vehicleId]);

  const handleReset = useCallback(() => {
    setStep(1);
    setFromCity("");
    setToCity("");
    setTransport("");
    setVehicleId("");
    setPeople(2);
    setDays(5);
    invalidateDistance();
  }, [invalidateDistance]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div
        className={`w-full bg-slate-900 rounded-3xl p-10 shadow-2xl ${
          currentStepKey === "result" ? "max-w-2xl" : "max-w-xl"
        }`}
      >
        <p className="text-blue-400 font-semibold mb-2">
          Adım {step} / {totalSteps}
        </p>

        {currentStepKey === "fromCity" && (
          <>
            <h1 className="text-4xl font-bold mb-3">Nereden çıkıyorsunuz?</h1>
            <p className="text-gray-400 mb-6">Başlangıç şehrinizi seçin.</p>

            <CitySearchInput
              value={fromCitySearch}
              onChange={setFromCitySearch}
              placeholder="Şehir ara..."
            />

            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
              {filteredFromCities.length > 0 ? (
                filteredFromCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setFromCity(city);
                      // Başlangıç şehri değişince eski hedef/mesafe artık
                      // geçersiz olabilir; kullanıcı hedefi yeniden seçince
                      // fetchDistance tekrar tetiklenir.
                      setToCity("");
                      invalidateDistance();
                    }}
                    className={`rounded-xl border p-3 transition ${
                      fromCity === city
                        ? "bg-blue-600 border-blue-600"
                        : "bg-slate-800 border-slate-700 hover:border-blue-500"
                    }`}
                  >
                    {city}
                  </button>
                ))
              ) : (
                <p className="col-span-2 py-6 text-center text-gray-500">
                  &ldquo;{fromCitySearch}&rdquo; için sonuç bulunamadı.
                </p>
              )}
            </div>

            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!fromCity}
              className={`mt-8 w-full rounded-xl py-4 font-semibold text-lg transition ${
                fromCity ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 cursor-not-allowed text-gray-400"
              }`}
            >
              Devam →
            </button>
          </>
        )}

        {currentStepKey === "toCity" && (
          <>
            <h1 className="text-4xl font-bold mb-3">Nereye gidiyorsunuz?</h1>
            <p className="text-gray-400 mb-6">Başlangıç: {fromCity}</p>

            <CitySearchInput
              value={toCitySearch}
              onChange={setToCitySearch}
              placeholder="Şehir ara..."
            />

            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
              {filteredToCities.length > 0 ? (
                filteredToCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setToCity(city);
                      fetchDistance(fromCity, city);
                    }}
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
                ))
              ) : (
                <p className="col-span-2 py-6 text-center text-gray-500">
                  &ldquo;{toCitySearch}&rdquo; için sonuç bulunamadı.
                </p>
              )}
            </div>

            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!toCity}
              className={`mt-8 w-full rounded-xl py-4 font-semibold text-lg transition ${
                toCity ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 cursor-not-allowed text-gray-400"
              }`}
            >
              Devam →
            </button>
          </>
        )}

        {currentStepKey === "transport" && (
          <>
            <h1 className="text-4xl font-bold mb-3">Nasıl gideceksiniz?</h1>
            <p className="text-gray-400 mb-6">{fromCity} → {toCity}</p>

            <div className="grid grid-cols-2 gap-4">
              {transports.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setTransport(item.id);
                    if (item.id !== "car") {
                      setVehicleId("");
                    }
                  }}
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
              onClick={() => setStep((s) => s + 1)}
              disabled={!transport}
              className={`mt-8 w-full rounded-xl py-4 font-semibold text-lg transition ${
                transport ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 cursor-not-allowed text-gray-400"
              }`}
            >
              Devam →
            </button>
          </>
        )}

        {currentStepKey === "vehicle" && (
          <>
            <h1 className="text-4xl font-bold mb-3">Aracınızı seçin</h1>
            <p className="text-gray-400 mb-6">
              Yakıt maliyeti hesaplaması için önce marka, sonra araç seçin.
            </p>

            <VehicleSelector selectedVehicleId={vehicleId} onSelect={setVehicleId} />

            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!vehicleId}
              className={`mt-8 w-full rounded-xl py-4 font-semibold text-lg transition ${
                vehicleId ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 cursor-not-allowed text-gray-400"
              }`}
            >
              Devam →
            </button>
          </>
        )}

        {currentStepKey === "people" && (
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
              onClick={() => setStep((s) => s + 1)}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-4 font-semibold text-lg transition"
            >
              Devam →
            </button>
          </>
        )}

        {currentStepKey === "days" && (
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
              onClick={() => setStep((s) => s + 1)}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-4 font-semibold text-lg transition"
            >
              Sonucu Gör →
            </button>
          </>
        )}

        {currentStepKey === "result" && (
          <>
            {isDistanceLoading && (
              <div className="rounded-2xl bg-slate-800 p-6 text-center text-gray-400">
                Mesafe hesaplanıyor...
              </div>
            )}

            {!isDistanceLoading && distanceError && (
              <div className="rounded-2xl bg-slate-800 border border-red-900 p-6">
                <p className="text-red-400 font-semibold mb-3">{distanceError}</p>
                <button
                  onClick={() => fetchDistance(fromCity, toCity)}
                  className="text-sm text-gray-300 hover:text-white transition underline"
                >
                  Tekrar dene
                </button>
              </div>
            )}

            {!isDistanceLoading && !distanceError && trip && distanceKm !== null && (
              <TripResultSummary
                fromCity={fromCity}
                toCity={toCity}
                distanceKm={distanceKm}
                isCar={transport === "car"}
                transportLabel={selectedTransport?.label ?? ""}
                transportIcon={selectedTransport?.emoji ?? ""}
                vehicleLabel={vehicleLabel}
                trip={trip}
                onReset={handleReset}
              />
            )}
          </>
        )}

        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="mt-6 w-full text-gray-400 hover:text-white transition"
          >
            ← Geri
          </button>
        )}

        <ProgressBar step={step} totalSteps={totalSteps} />
      </div>
    </main>
  );
}
