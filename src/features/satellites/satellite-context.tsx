'use client';

import { useSatelliteClient } from './use-satellite-client';
import { SatelliteClient } from '@/core/client/satellite-client';
import { createContext, ReactNode, use } from 'react';

const SatelliteClientContext = createContext<SatelliteClient | undefined>(
    undefined,
);

export function SatelliteClientProvider({
    children,
}: {
    readonly children: ReactNode;
}) {
    const client = useSatelliteClient();
    return (
        <SatelliteClientContext value={client}>
            {children}
        </SatelliteClientContext>
    );
}

export function useSatelliteClientContext(): SatelliteClient | undefined {
    return use(SatelliteClientContext);
}
