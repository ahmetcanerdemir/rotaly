"use client";

import { useMemo, useState } from "react";
import { vehicles, getVehiclesByBrand } from "../lib/vehicles";

type Props = {
  selectedVehicleId: string;
  onSelect: (vehicleId: string) => void;
};

export default function VehicleSelector({
  selectedVehicleId,
  onSelect,
}: Props) {
  const brands = useMemo(
    () => Array.from(new Set(vehicles.map((vehicle) => vehicle.brand))),
    []
  );

  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId)?.brand ?? null
  );

  const brandVehicles = selectedBrand ? getVehiclesByBrand(selectedBrand) : [];

  if (!selectedBrand) {
    return (
      <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
        {brands.map((brand) => (
          <button
            key={brand}
            onClick={() => setSelectedBrand(brand)}
            className="rounded-xl border p-3 transition bg-slate-800 border-slate-700 hover:border-blue-500"
          >
            {brand}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setSelectedBrand(null)}
        className="mb-4 text-sm text-gray-400 hover:text-white transition"
      >
        ← Marka değiştir
      </button>

      <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
        {brandVehicles.map((vehicle) => (
          <button
            key={vehicle.id}
            onClick={() => onSelect(vehicle.id)}
            className={`rounded-xl border p-3 text-left transition ${
              selectedVehicleId === vehicle.id
                ? "bg-blue-600 border-blue-600"
                : "bg-slate-800 border-slate-700 hover:border-blue-500"
            }`}
          >
            <div className="font-semibold">{vehicle.model}</div>
            <div className="text-xs text-gray-400">{vehicle.year}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
