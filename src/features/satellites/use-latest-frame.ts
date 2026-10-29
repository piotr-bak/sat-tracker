'use client';

import { SatelliteClient } from '@/core/client/satellite-client';
import { OutboundMsgOf } from '@/core/client/worker/protocol';
import { useEffect, useState } from 'react';

export function useLatestFrame(client: SatelliteClient | undefined) {
    const [frame, setFrame] = useState<OutboundMsgOf<'frame'>>();
    useEffect(() => {
        if (!client) return;
        return client.onFrame(setFrame);
    }, [client]);
    return frame;
}
