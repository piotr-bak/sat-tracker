import { assertNever } from '../shared/assert';
import { REFRESH_RATE_MS } from '../shared/constants';
import {
    type InboundMessage,
    type OutboundMessage,
    type OutboundMsgOf,
} from './worker/protocol';

type Listener<T> = (value: T) => void;

export class SatelliteClient {
    readonly #worker: Worker;
    readonly #frameListeners = new Set<Listener<OutboundMsgOf<'frame'>>>();
    readonly #readyListeners = new Set<Listener<OutboundMsgOf<'ready'>>>();
    readonly #errorListeners = new Set<Listener<OutboundMsgOf<'error'>>>();
    #lastReady: OutboundMsgOf<'ready'> | undefined;
    #frameId = 0;
    #rafId: number | undefined = undefined;
    #lastFrameAtMs = 0;
    #isInitSent = false;
    #isDisposed = false;
    #inFlight = false;

    constructor() {
        this.#worker = new Worker(
            new URL('./worker/worker.ts', import.meta.url),
            { type: 'module' },
        );
        this.#worker.onmessage = (e: MessageEvent<OutboundMessage>) =>
            this.#handleWorkerMessage(e);
        this.#worker.onerror = (e: ErrorEvent) => this.#handleWorkerError(e);
        this.#worker.onmessageerror = (e: MessageEvent) =>
            this.#handleWorkerMessageError(e);
    }

    #handleWorkerMessage(event: MessageEvent<OutboundMessage>) {
        const msg = event.data;
        switch (msg.type) {
            case 'status':
                return;

            case 'ready':
                this.#lastReady = msg;
                this.#emit(this.#readyListeners, msg);
                if (this.#rafId === undefined) {
                    this.#loop();
                }
                return;

            case 'frame':
                this.#inFlight = false;
                this.#emit(this.#frameListeners, msg);
                return;

            case 'error':
                this.#inFlight = false;
                this.#emit(this.#errorListeners, msg);
                return;

            default:
                assertNever(msg);
        }
    }

    #handleWorkerError(event: ErrorEvent) {
        this.#inFlight = false;
        this.#emit(this.#errorListeners, {
            type: 'error',
            error: {
                kind: 'internal',
                message: event.message || 'worker failed',
            },
        });
    }

    #handleWorkerMessageError(_: MessageEvent) {
        this.#inFlight = false;
        this.#emit(this.#errorListeners, {
            type: 'error',
            error: {
                kind: 'internal',
                message: '[WORKER] Worker message could not be deserialized',
            },
        });
    }

    #post(message: InboundMessage) {
        if (this.#isDisposed) return;
        this.#worker.postMessage(message);
    }

    #subscribe<T>(set: Set<Listener<T>>, cb: Listener<T>): () => void {
        set.add(cb);
        return () => set.delete(cb);
    }

    #callSafely<T>(cb: Listener<T>, value: T) {
        try {
            cb(value);
        } catch (e) {
            console.error('[SatelliteClient] listener threw', e);
        }
    }

    #emit<T>(set: Set<Listener<T>>, value: T) {
        for (const cb of set) this.#callSafely(cb, value);
    }

    readonly #loop = () => {
        if (this.#isDisposed) return;
        this.#rafId = requestAnimationFrame(this.#loop);

        if (this.#inFlight) return;

        const now = Date.now();
        if (now - this.#lastFrameAtMs < REFRESH_RATE_MS) return;

        this.#inFlight = true;
        this.#frameId++;
        this.#lastFrameAtMs = now;
        this.#post({
            type: 'tick',
            frameId: this.#frameId,
            epochMs: now,
        });
    };

    start(snapshotUrl: string) {
        if (this.#isDisposed) return;
        if (this.#isInitSent) return;
        this.#post({ type: 'init', url: snapshotUrl });
        this.#isInitSent = true;
    }

    select(index: number | undefined) {
        if (this.#isDisposed) return;
        if (!this.#isInitSent) return;
        this.#post({ type: 'select', index });
    }

    dispose() {
        if (this.#isDisposed) return;
        this.#isDisposed = true;
        if (this.#rafId !== undefined) cancelAnimationFrame(this.#rafId);
        this.#rafId = undefined;
        this.#lastReady = undefined;
        this.#worker.terminate();
        this.#frameListeners.clear();
        this.#readyListeners.clear();
        this.#errorListeners.clear();
    }

    onFrame(cb: Listener<OutboundMsgOf<'frame'>>) {
        return this.#subscribe(this.#frameListeners, cb);
    }

    onReady(cb: Listener<OutboundMsgOf<'ready'>>) {
        if (this.#lastReady) this.#callSafely(cb, this.#lastReady);
        return this.#subscribe(this.#readyListeners, cb);
    }

    onError(cb: Listener<OutboundMsgOf<'error'>>) {
        return this.#subscribe(this.#errorListeners, cb);
    }
}
