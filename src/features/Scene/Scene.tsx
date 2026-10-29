'use client';
import './worker-setup';
import { ReactNode } from 'react';
import styles from './Scene.module.scss';

export function Scene({ children }: { readonly children: ReactNode }) {
    return <div className={styles.scene}>{children}</div>;
}
