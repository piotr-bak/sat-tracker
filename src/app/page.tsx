import styles from './page.module.scss';
import { Globe } from '../features/Globe/Globe';
import { Scene } from '@/features/Scene/Scene';

export default function Home() {
    return (
        <main id="root" className={styles.container}>
            <Scene>
                <Globe />
            </Scene>
        </main>
    );
}
