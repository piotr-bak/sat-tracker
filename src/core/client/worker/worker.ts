import { ISSUES_MAX, SNAPSHOT_FETCH_TIMEOUT_MS } from '@/core/shared/constants';
import { SnapshotEnvelopeSchema } from '@/core/shared/omm/schemas';
import { checkIntegrity, validate } from '@/core/shared/omm/validation';
import { err, ok, type Result } from '@/core/shared/result';
import { FetchError, LoadedSnapshot, SnapshotLoadError } from './protocol';

async function fetchData(url: string): Promise<Result<string, FetchError>> {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(SNAPSHOT_FETCH_TIMEOUT_MS),
        });

        if (!response.ok) {
            return err({
                kind: 'fetch_error',
                message: `HTTP ${response.status}`,
            });
        }

        return ok(await response.text());
    } catch (error) {
        // error.name separates a TimeoutError from a network failure (TypeError).
        return err({
            kind: 'fetch_error',
            message:
                error instanceof Error
                    ? `${error.name}: ${error.message}`
                    : 'unknown error',
        });
    }
}

export async function loadSnapshot(
    url: string,
): Promise<Result<LoadedSnapshot, SnapshotLoadError>> {
    const fetched = await fetchData(url);
    if (!fetched.ok) return err(fetched.error);

    let json: unknown;
    try {
        json = JSON.parse(fetched.value);
    } catch {
        return err({ kind: 'invalid_json' });
    }

    const envelope = SnapshotEnvelopeSchema.safeParse(json);
    if (!envelope.success) {
        return err({
            kind: 'invalid_envelope',
            issues: envelope.error.issues
                .slice(0, ISSUES_MAX)
                .map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        });
    }

    const checked = checkIntegrity(validate(envelope.data.rows));
    if (!checked.ok) return err(checked.error);

    return ok({
        rows: checked.value.rows,
        droppedCount: checked.value.droppedCount,
        fetchedAtMs: envelope.data.fetchedAtMs,
    });
}
