import { assert, assertNever } from '@/core/shared/assert';
import { buildSatelliteRecords, computeFrame } from './propagation';
import type {
    InboundMessage,
    InboundMsgOf,
    OutboundMessage,
    ProcessedSatRecData,
    WorkerError,
} from './protocol';
import { loadSnapshot } from './snapshot-loader';

type WorkerState =
    | { status: 'idle' }
    | { status: 'loading' }
    | {
          status: 'ready';
          data: ProcessedSatRecData;
          selectedIndex: number | undefined;
      }
    | { status: 'failed'; error: WorkerError };

let state: WorkerState = { status: 'idle' };

function send(message: OutboundMessage, transfer: Transferable[] = []): void {
    self.postMessage(message, { transfer });
}

// Expected failures are values
function fail(error: WorkerError): void {
    state = { status: 'failed', error };
    send({ type: 'error', error });
}

async function handleInit(message: InboundMsgOf<'init'>): Promise<void> {
    if (state.status !== 'idle') return; // a second init is ignored
    state = { status: 'loading' };
    send({ type: 'status', stage: 'loading' });

    const snapshot = await loadSnapshot(message.url);
    if (!snapshot.ok) {
        fail({ kind: 'load_failed', cause: snapshot.error });
        return;
    }

    const built = buildSatelliteRecords(snapshot.value.rows);
    if (!built.ok) {
        fail({ kind: 'build_failed', cause: built.error });
        return;
    }

    state = { status: 'ready', data: built.value, selectedIndex: undefined };

    // Transferring detaches the array it sends so the main thread gets a copy and the worker keeps the original
    const idsForMainThread = built.value.validSatIds.slice();
    send(
        {
            type: 'ready',
            count: idsForMainThread.length,
            invalidSatCount: built.value.invalidSatCount,
            droppedRowCount: snapshot.value.droppedCount,
            fetchedAtMs: snapshot.value.fetchedAtMs,
            validSatIds: idsForMainThread,
        },
        [idsForMainThread.buffer],
    );
}

function handleTick(message: InboundMsgOf<'tick'>): void {
    if (state.status !== 'ready') {
        send({ type: 'error', error: { kind: 'not_ready' } });
        return;
    }

    // An invalid Date would make every satellite fail silently
    assert(
        Number.isFinite(message.epochMs),
        'tick epochMs must be a finite number',
    );

    const startedAtMs = performance.now();
    const frame = computeFrame(
        state.data.satRecData,
        new Date(message.epochMs),
    );
    const computeMs = performance.now() - startedAtMs;

    send(
        {
            type: 'frame',
            frameId: message.frameId, // Echoed here - so the main thread can match a reply to its request
            epochMs: message.epochMs,
            positions: frame.satPositions,
            visibilityMask: frame.visibilityMask,
            failedPropagationCount: frame.failedPropagationCount,
            computeMs,
        },
        [frame.satPositions.buffer, frame.visibilityMask.buffer],
    );
}

function handleSelect(message: InboundMsgOf<'select'>): void {
    if (state.status !== 'ready') {
        send({ type: 'error', error: { kind: 'not_ready' } });
        return;
    }
    const { index } = message;
    const isValidIndex =
        index === undefined ||
        (Number.isInteger(index) &&
            index >= 0 &&
            index < state.data.satRecData.length);
    if (!isValidIndex) {
        send({ type: 'error', error: { kind: 'invalid_selection', index } });
        return;
    }
    state = { ...state, selectedIndex: index };
}

function handleGetDetails(_message: InboundMsgOf<'get_details'>) {
    //TODO
    return undefined;
}

async function dispatch(message: InboundMessage): Promise<void> {
    switch (message.type) {
        case 'init':
            await handleInit(message);
            return;
        case 'tick':
            handleTick(message);
            return;
        case 'select':
            handleSelect(message);
            return;
        case 'get_details':
            handleGetDetails(message);
            return;
        default:
            return assertNever(message);
    }
}

// The try/catch used only here. Reaching it means something went really wrong
// (a bug: an assertion or an unexpected throw) because the expected failures
// are handled as values (see function fail())
async function run(message: InboundMessage): Promise<void> {
    try {
        await dispatch(message);
    } catch (cause) {
        const error: WorkerError = {
            kind: 'internal',
            message:
                cause instanceof Error
                    ? `${cause.name}: ${cause.message}`
                    : 'unknown error',
        };

        if (state.status === 'loading') state = { status: 'failed', error };
        send({ type: 'error', error });
    }
}

self.onmessage = (event: MessageEvent<InboundMessage>): void => {
    void run(event.data);
};
