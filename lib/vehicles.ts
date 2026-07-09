// lib/vehicles.ts
//
// Araç kataloğu (mock veri).
//
// Bu dosya, ileride kullanıcının somut bir araç seçip o araca göre
// (fuelType + consumptionPer100Km) hesaplama yapabilmesi için temel
// oluşturur. Şu an sadece statik bir katalog + birkaç saf yardımcı
// fonksiyondur — `lib/tripCalculator.ts` henüz buna bağlı DEĞİLDİR,
// mevcut orchestrator hiç değişmedi.
//
// İleride genişletme planı (henüz yapılmadı):
// `TripCalculationInput`'a isteğe bağlı bir `vehicleId?: string` alanı
// eklenir; `calculateTrip` bu id'yi `getVehicleById` ile çözüp
// `fuelType`/`consumptionPer100Km`'i otomatik doldurabilir. Bu dosyadaki
// `id` alanı ve `getVehicleById` tam olarak bu senaryo için hazırlandı.

import type { FuelType } from "./costs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Vehicle {
  /** Benzersiz kimlik (örn. "toyota-corolla-2023"). */
  id: string;
  brand: string;
  model: string;
  fuelType: FuelType;
  /** 100 km başına tüketim: L (gasoline/diesel/hybrid) veya kWh (electric). */
  consumptionPer100Km: number;
  /** Temsili model yılı. */
  year: number;
}

interface VehicleSeed {
  brand: string;
  model: string;
  fuelType: FuelType;
  consumptionPer100Km: number;
  year: number;
}

// ---------------------------------------------------------------------------
// Id üretimi
// ---------------------------------------------------------------------------

function createVehicleId(brand: string, model: string, year: number): string {
  return `${brand}-${model}-${year}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

// ---------------------------------------------------------------------------
// Mock araç listesi — Türkiye'de yaygın satılan 40 model
// ---------------------------------------------------------------------------

const VEHICLE_SEEDS: VehicleSeed[] = [
  { brand: "Fiat", model: "Egea", fuelType: "gasoline", consumptionPer100Km: 6.0, year: 2023 },
  { brand: "Fiat", model: "Egea Cross", fuelType: "diesel", consumptionPer100Km: 4.8, year: 2022 },
  { brand: "Renault", model: "Clio", fuelType: "gasoline", consumptionPer100Km: 5.5, year: 2023 },
  { brand: "Renault", model: "Megane", fuelType: "diesel", consumptionPer100Km: 4.3, year: 2022 },
  { brand: "Renault", model: "Kadjar", fuelType: "diesel", consumptionPer100Km: 4.6, year: 2021 },
  { brand: "Renault", model: "Zoe", fuelType: "electric", consumptionPer100Km: 15.8, year: 2021 },
  { brand: "Dacia", model: "Duster", fuelType: "diesel", consumptionPer100Km: 5.2, year: 2023 },
  { brand: "Dacia", model: "Sandero", fuelType: "gasoline", consumptionPer100Km: 5.8, year: 2023 },
  { brand: "Volkswagen", model: "Passat", fuelType: "diesel", consumptionPer100Km: 5.0, year: 2022 },
  { brand: "Volkswagen", model: "Golf", fuelType: "gasoline", consumptionPer100Km: 5.9, year: 2023 },
  { brand: "Volkswagen", model: "Tiguan", fuelType: "diesel", consumptionPer100Km: 5.7, year: 2022 },
  { brand: "Toyota", model: "Corolla", fuelType: "gasoline", consumptionPer100Km: 6.2, year: 2023 },
  { brand: "Toyota", model: "Corolla Hybrid", fuelType: "hybrid", consumptionPer100Km: 4.1, year: 2023 },
  { brand: "Toyota", model: "C-HR Hybrid", fuelType: "hybrid", consumptionPer100Km: 4.3, year: 2022 },
  { brand: "Toyota", model: "RAV4 Hybrid", fuelType: "hybrid", consumptionPer100Km: 5.0, year: 2023 },
  { brand: "Hyundai", model: "i20", fuelType: "gasoline", consumptionPer100Km: 5.6, year: 2023 },
  { brand: "Hyundai", model: "Bayon", fuelType: "gasoline", consumptionPer100Km: 5.9, year: 2022 },
  { brand: "Hyundai", model: "Tucson", fuelType: "diesel", consumptionPer100Km: 5.3, year: 2023 },
  { brand: "Hyundai", model: "Kona Electric", fuelType: "electric", consumptionPer100Km: 14.7, year: 2022 },
  { brand: "Ford", model: "Focus", fuelType: "gasoline", consumptionPer100Km: 6.1, year: 2021 },
  { brand: "Ford", model: "Puma", fuelType: "gasoline", consumptionPer100Km: 5.4, year: 2022 },
  { brand: "Ford", model: "Kuga", fuelType: "diesel", consumptionPer100Km: 5.5, year: 2022 },
  { brand: "Opel", model: "Astra", fuelType: "gasoline", consumptionPer100Km: 6.0, year: 2021 },
  { brand: "Opel", model: "Corsa", fuelType: "gasoline", consumptionPer100Km: 5.3, year: 2023 },
  { brand: "Peugeot", model: "208", fuelType: "gasoline", consumptionPer100Km: 5.2, year: 2023 },
  { brand: "Peugeot", model: "301", fuelType: "gasoline", consumptionPer100Km: 6.5, year: 2021 },
  { brand: "Peugeot", model: "3008", fuelType: "diesel", consumptionPer100Km: 4.9, year: 2022 },
  { brand: "Citroen", model: "C-Elysee", fuelType: "gasoline", consumptionPer100Km: 6.4, year: 2021 },
  { brand: "Skoda", model: "Octavia", fuelType: "diesel", consumptionPer100Km: 4.8, year: 2022 },
  { brand: "Skoda", model: "Fabia", fuelType: "gasoline", consumptionPer100Km: 5.1, year: 2023 },
  { brand: "Honda", model: "Civic", fuelType: "gasoline", consumptionPer100Km: 6.3, year: 2022 },
  { brand: "Honda", model: "CR-V Hybrid", fuelType: "hybrid", consumptionPer100Km: 5.4, year: 2023 },
  { brand: "Nissan", model: "Qashqai", fuelType: "gasoline", consumptionPer100Km: 6.0, year: 2022 },
  { brand: "Kia", model: "Sportage", fuelType: "diesel", consumptionPer100Km: 5.6, year: 2023 },
  { brand: "Kia", model: "Ceed", fuelType: "gasoline", consumptionPer100Km: 6.0, year: 2022 },
  { brand: "Mercedes-Benz", model: "C 220 d", fuelType: "diesel", consumptionPer100Km: 5.1, year: 2023 },
  { brand: "BMW", model: "320i", fuelType: "gasoline", consumptionPer100Km: 6.5, year: 2023 },
  { brand: "Audi", model: "A3", fuelType: "gasoline", consumptionPer100Km: 5.9, year: 2022 },
  { brand: "Togg", model: "T10X", fuelType: "electric", consumptionPer100Km: 16.5, year: 2023 },
  { brand: "Tesla", model: "Model 3", fuelType: "electric", consumptionPer100Km: 14.9, year: 2023 },
  { brand: "MG", model: "ZS EV", fuelType: "electric", consumptionPer100Km: 17.2, year: 2022 },
  { brand: "BYD", model: "Atto 3", fuelType: "electric", consumptionPer100Km: 15.9, year: 2023 },
];

// ---------------------------------------------------------------------------
// Katalog
// ---------------------------------------------------------------------------

export const vehicles: Vehicle[] = VEHICLE_SEEDS.map((seed) => ({
  id: createVehicleId(seed.brand, seed.model, seed.year),
  ...seed,
}));

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

export function getVehicleById(id: string): Vehicle | undefined {
  return vehicles.find((vehicle) => vehicle.id === id);
}

export function getVehiclesByBrand(brand: string): Vehicle[] {
  const normalizedBrand = brand.trim().toLowerCase();
  return vehicles.filter(
    (vehicle) => vehicle.brand.toLowerCase() === normalizedBrand
  );
}

export function getVehiclesByFuelType(fuelType: FuelType): Vehicle[] {
  return vehicles.filter((vehicle) => vehicle.fuelType === fuelType);
}
