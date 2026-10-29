'use client';

import { DeckOverlay } from './DeckOverlay';
import { useAllSatellitesLayer } from './layers/use-all-satellites-layer';

export function SatelliteLayers() {
    const allSatellites = useAllSatellitesLayer();

    const layers = [allSatellites].filter((layer) => layer !== undefined);

    return <DeckOverlay interleaved layers={layers} />;
}
