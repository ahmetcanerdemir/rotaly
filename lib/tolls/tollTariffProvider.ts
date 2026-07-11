// lib/tolls/tollTariffProvider.ts
//
// lib/maps.ts'teki MapsProvider ve lib/fuel/'daki FuelPriceProvider ile
// aynı Provider deseni: bir arayüz + değiştirilebilir implementasyon(lar).
//
// Not: Bu servis, tamamen statik/bellek-içi bir tablo üzerinde çalıştığı
// için (KGM'nin sorgulanabilir bir API'si yok — bkz. tollTariffMock.ts
// dosya başı notu) `getTariff` bilerek SENKRON bir fonksiyondur; async
// bir sürüme gerek yoktur ve bu sayede saf, client-side (React
// component'leri içinde de) doğrudan çağrılabilir.

import type { TollTariffRequest, TollTariffResult } from "./tollTariffTypes";
import { TOLL_ASSETS, TOLL_CORRIDORS } from "./tollTariffMock";

function normalize(value: string): string {
  return value.toLocaleLowerCase("tr-TR").trim();
}

export interface TollTariffProvider {
  getTariff(request: TollTariffRequest): TollTariffResult | null;
}

/**
 * Kürasyonlu, resmi KGM verisine dayalı sağlayıcı.
 *
 * Şehir çifti yön bağımsız aranır (A→B ile B→A aynı fiziksel güzergahtır,
 * HGS ücreti genelde her iki yönde de aynıdır).
 */
export class CuratedTollTariffProvider implements TollTariffProvider {
  getTariff(request: TollTariffRequest): TollTariffResult | null {
    const from = normalize(request.fromCity);
    const to = normalize(request.toCity);

    const corridor = TOLL_CORRIDORS.find((entry) => {
      const entryFrom = normalize(entry.fromCity);
      const entryTo = normalize(entry.toCity);
      return (
        (entryFrom === from && entryTo === to) ||
        (entryFrom === to && entryTo === from)
      );
    });

    if (!corridor) {
      return null;
    }

    const assets = corridor.assetIds
      .map((id) => TOLL_ASSETS.find((asset) => asset.id === id))
      .filter((asset): asset is TollAssetFound => Boolean(asset));

    if (assets.length === 0) {
      return null;
    }

    const carPriceOneWay = assets.reduce(
      (total, asset) => total + asset.carPriceOneWay,
      0
    );

    const bridgeFee = assets
      .filter((asset) => asset.kind === "bridge")
      .reduce((total, asset) => total + asset.carPriceOneWay, 0);

    const highwayFee = assets
      .filter((asset) => asset.kind === "highway")
      .reduce((total, asset) => total + asset.carPriceOneWay, 0);

    const confidence = assets.every((asset) => asset.confidence === "verified")
      ? "verified"
      : "aggregator";

    return {
      corridor: {
        fromCity: corridor.fromCity,
        toCity: corridor.toCity,
        carPriceOneWay,
        bridgeFee,
        highwayFee,
        confidence,
        assets,
        notes: corridor.notes,
      },
    };
  }
}

type TollAssetFound = (typeof TOLL_ASSETS)[number];
