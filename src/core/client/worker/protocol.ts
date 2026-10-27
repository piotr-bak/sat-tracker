import type { IntegrityError } from '@/core/shared/omm/errors';
import type { OmmRecord } from '@/core/shared/omm/schemas';
import type { SatRec } from 'satellite.js';

export type ProcessedSatRecData = {
    satRecData: SatRec[];
    validSatIds: Int32Array;
    invalidSatCount: number;
};

export type Frame = {
    satPositions: Float32Array<ArrayBuffer>; // [longitude (deg), latitude (deg), altitude (m)] per satellite
    visibilityMask: Uint8Array<ArrayBuffer>; // 1 = draw, 0 = hide
    failedPropagationCount: number;
};

export type LoadedSnapshot = {
    readonly rows: OmmRecord[];
    readonly droppedCount: number;
    readonly fetchedAtMs: number;
};

export type InboundMessage =
    | { readonly type: 'init'; readonly url: string }
    | {
          readonly type: 'tick';
          readonly frameId: number;
          readonly epochMs: number;
      }
    | { readonly type: 'select'; readonly index: number | undefined }
    | {
          readonly type: 'get_details';
          readonly requestId: number;
          readonly index: number;
      };

export type InboundMsgOf<K extends InboundMessage['type']> = Extract<
    InboundMessage,
    { type: K }
>;

export type OutboundMessage =
    | { readonly type: 'status'; readonly stage: 'loading' }
    | {
          readonly type: 'ready';
          readonly count: number;
          readonly invalidSatCount: number; // satrecs that failed to initialize
          readonly droppedRowCount: number; // rows rejected by client-side validation
          readonly fetchedAtMs: number;
          readonly validSatIds: Int32Array<ArrayBuffer>;
      }
    | {
          readonly type: 'frame';
          readonly frameId: number;
          readonly epochMs: number;
          readonly positions: Float32Array<ArrayBuffer>;
          readonly visibilityMask: Uint8Array<ArrayBuffer>;
          readonly failedPropagationCount: number;
          readonly computeMs: number;
      }
    | { readonly type: 'error'; readonly error: WorkerError };

export type OutboundMsgOf<K extends OutboundMessage['type']> = Extract<
    OutboundMessage,
    { type: K }
>;

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

export type WorkerError =
    | { readonly kind: 'load_failed'; readonly cause: SnapshotLoadError }
    | { readonly kind: 'build_failed'; readonly cause: SatRecProcessingError }
    | { readonly kind: 'not_ready' }
    | { readonly kind: 'invalid_selection'; readonly index: number }
    | { readonly kind: 'not_implemented'; readonly feature: string }
    | { readonly kind: 'internal'; readonly message: string };
