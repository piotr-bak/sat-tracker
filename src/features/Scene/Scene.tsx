import './worker-setup';
import { ReactNode } from 'react';
import styles from './Scene.module.scss';

export function Scene({ children }: { readonly children: ReactNode }) {
    return <main className={styles.scene}>{children}</main>;
}
