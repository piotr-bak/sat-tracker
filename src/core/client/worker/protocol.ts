import type { IntegrityError } from '@/core/shared/omm/errors';
import type { OmmRecord } from '@/core/shared/omm/schemas';
import type { SatRec } from 'satellite.js';

export type ProcessedSatRecData = {
    satRecData: SatRec[];
    validSatIds: Int32Array;
    invalidSatCount: number;
};

export type Frame = {
    satPositions: Float32Array; // [longitude (deg), latitude (deg), altitude (m)] per satellite
    visibilityMask: Uint8Array; // 1 = draw, 0 = hide
    failedPropagationCount: number;
};

export type LoadedSnapshot = {
    readonly rows: OmmRecord[];
    readonly droppedCount: number;
    readonly fetchedAtMs: number;
};

export type FetchError = {
    readonly kind: 'fetch_error';
    readonly message: string;
};

export type SnapshotLoadError =
    | FetchError
    | { readonly kind: 'invalid_json' }
    | { readonly kind: 'invalid_envelope'; readonly issues: readonly string[] }
    | IntegrityError;

export type SatRecProcessingError = {
    readonly message: string;
};
