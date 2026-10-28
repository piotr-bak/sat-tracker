import 'server-only';
import type { BlobStoreError } from '@/core/server/errors';
import { BlobNotFoundError, head, put } from '@vercel/blob';
import { type Result, err, ok } from '@/core/shared/result';
import type { Snapshot } from '../../shared/omm/schemas';

// Snapshot path defined here and not in the constants.ts in order
// not to drag a server env variable into the code that browser imports
// (which would happen if the constatns.ts would reference the .env)
const SNAPSHOT_PATH = `gp/${process.env.VERCEL_ENV ?? 'local'}/snapshot.json`;
const SNAPSHOT_CACHE_SECONDS = 3600;

export async function getSnapshotUrl(): Promise<
    Result<string | undefined, BlobStoreError>
> {
    try {
        const meta = await head(SNAPSHOT_PATH);
        const response = await fetch(meta.url, { cache: 'no-store' });

        if (!response.ok) {
            return err({
                kind: 'blob_read_failed',
                cause: new Error(`HTTP ${response.status}`),
            });
        }
        return ok(meta.url);
    } catch (cause) {
        if (cause instanceof BlobNotFoundError) return ok(undefined);
        return err({ kind: 'blob_read_failed', cause });
    }
}

export async function writeSnapshot(
    snapshot: Snapshot,
): Promise<Result<{ url: string }, BlobStoreError>> {
    try {
        const blob = await put(SNAPSHOT_PATH, JSON.stringify(snapshot), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false, // same URL every day
            allowOverwrite: true, // required to replace the file
            cacheControlMaxAge: SNAPSHOT_CACHE_SECONDS,
        });
        return ok({ url: blob.url });
    } catch (cause) {
        return err({ kind: 'blob_write_failed', cause });
    }
}
