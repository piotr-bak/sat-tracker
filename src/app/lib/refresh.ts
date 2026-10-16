import "server-only";
import { writeSnapshot } from "./blob-store";
import {
    fetchCelesTrakData,
    parseCsv,
    checkIntegrity,
    validate,
} from "./celestrak";
import { OmmSchema, Snapshot } from "./schemas";
import { RefreshError } from "./types/errors";
import { Result, err, ok } from "./types/result";

export async function refreshSnapshot(): Promise<
    Result<
        { rowCount: number; droppedCount: number; url: string },
        RefreshError
    >
> {
    let csv: string;

    try {
        csv = await fetchCelesTrakData();
    } catch (cause) {
        return err({
            kind: "upstream_failed",
            message: cause instanceof Error ? cause.message : "unknown",
        });
    }

    const parsed = parseCsv(csv, Object.keys(OmmSchema.shape));
    if (!parsed.ok) return err(parsed.error);

    const gated = checkIntegrity(validate(parsed.value));
    if (!gated.ok) return err(gated.error);

    const snapshot: Snapshot = {
        schemaVer: 1,
        fetchedAtMs: Date.now(),
        rows: gated.value.rows,
    };

    const written = await writeSnapshot(snapshot);
    if (!written.ok) return err(written.error);

    return ok({
        rowCount: snapshot.rows.length,
        droppedCount: gated.value.droppedCount,
        url: written.value.url,
    });
}
