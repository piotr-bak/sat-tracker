'use client';
import './worker-setup';
import { ReactNode } from 'react';
import styles from './Scene.module.scss';
import { SatelliteClientProvider } from '../satellites/satellite-context';

export function Scene({ children }: { readonly children: ReactNode }) {
    return (
        <SatelliteClientProvider>
            <div className={styles.scene}>{children}</div>
        </SatelliteClientProvider>
    );
}
