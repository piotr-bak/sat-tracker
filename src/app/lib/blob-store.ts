import "server-only";
import { z } from "zod";
import { err, ok, Result } from "./types/result";
import { OmmSchema, Snapshot, SnapshotSchema } from "./schemas";
import { BlobNotFoundError, head, put } from "@vercel/blob";
import { BlobStoreError, RefreshError } from "./types/errors";
import { checkIntegrity, fetchCelesTrakData, parseCsv, validate } from "./celestrak";

// The below defined here and not in the constants.ts in order 
// not to drag a server env variable into code the browser imports
const SNAPSHOT_PATH = `gp/${process.env.VERCEL_ENV ?? "local"}/snapshot.json`;
const SNAPSHOT_CACHE_SECONDS = 3600;

export async function readSnapshot(): Promise<Result<Snapshot | undefined, BlobStoreError>> {
    let json: unknown;
    try {
        const meta = await head(SNAPSHOT_PATH);
        const response = await fetch(meta.url, { cache: "no-store" });
        
        if (!response.ok) return err({
            kind: "blob_read_failed",
            cause: new Error(`HTTP ${response.status}`)
        })
        
        json = await response.json();
    } catch (cause) {
        if ( cause instanceof BlobNotFoundError) return ok(undefined);
        return err({ kind: "blob_read_failed", cause})
    }

    const parsed = z.safeParse(SnapshotSchema, json);
    if (!parsed.success) {
        return err({
            kind: "blob_invalid_snapshot",
            issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`)
        });
    }
    return ok(parsed.data);
}

export async function writeSnapshot(snapshot: Snapshot): Promise<Result<{ url: string }, BlobStoreError>> {
  try {
    const blob = await put(SNAPSHOT_PATH, JSON.stringify(snapshot), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false, // same URL every day
      allowOverwrite: true,   // required to replace the file
      cacheControlMaxAge: SNAPSHOT_CACHE_SECONDS,
    });
    return ok({ url: blob.url });
  } catch (cause) {
    return err({ kind: "blob_write_failed", cause });
  }
}

export async function refreshSnapshot(): Promise<Result<{rowCount: number, droppedCount: number, url: string}, RefreshError>> {
    let csv: string;

    try {
        csv = await fetchCelesTrakData();
    } catch(cause) {
        return err({ kind: "upstream_failed", message: cause instanceof Error ? cause.message : "unknown" });
    }

    const parsed = parseCsv(csv, Object.keys(OmmSchema.shape));
    if (!parsed.ok) return err(parsed.error);

    const gated = checkIntegrity(validate(parsed.value));
    if (!gated.ok) return err(gated.error);

    const snapshot: Snapshot = {
        schemaVer: 1,
        fetchedAtMs: Date.now(),
        rows: gated.value.rows,
    }

    const written = await writeSnapshot(snapshot);
    if (!written.ok) return err(written.error);

    return ok({
        rowCount: snapshot.rows.length,
        droppedCount: gated.value.droppedCount,
        url: written.value.url
    })
}