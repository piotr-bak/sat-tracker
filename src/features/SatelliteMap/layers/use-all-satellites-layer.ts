import { useSatelliteClientContext } from '@/features/satellites/satellite-context';
import { useLatestFrame } from '@/features/satellites/use-latest-frame';
import { useMemo } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';

// DataFilterExtension used here because computeFrame leaves a satellite's slots as zeros when
// SGP4 fails to propagate it. Without filtering those satellites would be drawn at [0°, 0°, 0 m].
// The mask plus this extension makes the layer skip them.
// See computeFrame() in core/client/worker/propagation.ts
const filter = new DataFilterExtension({ filterSize: 1 });

export function useAllSatellitesLayer() {
    const client = useSatelliteClientContext();
    const frame = useLatestFrame(client);

    return useMemo(() => {
        if (!frame) return undefined;
        return new ScatterplotLayer({
            id: 'satellites',
            data: {
                length: frame.positions.length / 3,
                attributes: {
                    getPosition: { value: frame.positions, size: 3 },
                    getFilterValue: { value: frame.visibilityMask, size: 1 },
                },
            },
            billboard: true,
            radiusUnits: 'pixels',
            getRadius: 2,
            getFillColor: [255, 255, 255, 220],
            extensions: [filter],
            filterRange: [1, 1],
            pickable: true,
            onClick: (info) => {
                if (info.index >= 0) client?.select(info.index);
            },
        });
    }, [frame, client]);
}
