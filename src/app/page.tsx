import styles from './page.module.scss';
import { SatelliteMap } from '@/features/SatelliteMap';
import { Scene } from '@/features/Scene';

export default function Home() {
    return (
        <main id="root" className={styles.container}>
            <Scene>
                <SatelliteMap />
            </Scene>
        </main>
    );
}
