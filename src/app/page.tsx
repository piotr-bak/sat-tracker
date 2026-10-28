import styles from './page.module.scss';
import { Globe } from '../features/Globe/Globe';

export default function Home() {
    return (
        <main id="root" className={styles.container}>
            <Globe />
        </main>
    );
}
