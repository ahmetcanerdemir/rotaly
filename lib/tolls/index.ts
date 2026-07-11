// lib/tolls/index.ts
//
// Toll Engine için genel (barrel) dışa aktarım. Bu, projedeki TEK toll
// mimarisidir — eski, paralel şehir-çifti sistemi kaldırıldı;
// `lib/maps/routeComparison/compareRoutes.ts` dahil tüm çağıranlar bu
// modülü kullanıyor.

export type {
  VehicleClass,
  TollFacilityType,
  TollSourceType,
  TollResultStatus,
  TollFacility,
  TollSegment,
  TollRouteInput,
  TollCalculationResult,
  TollCorridorSegmentDefinition,
  TollCorridorDefinition,
} from "./types";

export { TOLL_FACILITIES, TOLL_CORRIDORS } from "./tollData";
export { calculateToll } from "./tollCalculator";
export {
  type TollProvider,
  StaticTollProvider,
  EmptyTollProvider,
  getTollProvider,
  setTollProviderForTesting,
} from "./tollProvider";
