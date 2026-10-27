import type { OmmRecord } from './schemas';

export type ValidatedOmmRows = { rows: OmmRecord[]; droppedCount: number };
