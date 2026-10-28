'use client';
import { useEffect, useState } from 'react';
import { SatelliteClient } from '../satellite-client';
import { SNAPSHOT_ENDPOINT } from '@/core/shared/constants';

export function useSatelliteClient(): SatelliteClient | undefined {
    const [client, setClient] = useState<SatelliteClient | undefined>(
        undefined,
    );

    useEffect(() => {
        const snapshotUrl = new URL(SNAPSHOT_ENDPOINT, location.origin).href;
        const satClient = new SatelliteClient(snapshotUrl);
        satClient.start();
        setClient(satClient);

        return () => {
            satClient.dispose();
            setClient(undefined);
        };
    }, []);

    return client;
}
