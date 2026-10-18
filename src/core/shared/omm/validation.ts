import { z } from "zod";
import { type OmmRecord, OmmSchema } from "./schemas";
import { err, ok, type Result } from "../result";
import type { IntegrityError } from "./errors";
import type { ValidatedOmmRows } from "./types";
import { DROPPED_RATIO_MAX, ROWS_MIN } from "../constants";

export function validate(data: readonly unknown[]): ValidatedOmmRows {
    const rows: OmmRecord[] = [];
    let droppedCount = 0;

    for (const record of data) {
        const result = z.safeParse(OmmSchema, record);

        if (result.success) {
            rows.push(result.data);
            continue;
        }

        droppedCount += 1;
    }

    return {
        rows,
        droppedCount: droppedCount,
    };
}

export function checkIntegrity(
    data: ValidatedOmmRows,
): Result<ValidatedOmmRows, IntegrityError> {
    const rowCount = data.rows.length;
    const total = rowCount + data.droppedCount;

    if (rowCount < ROWS_MIN) {
        return err({
            kind: "integrity_row_count_too_low",
            rowCount,
            min: ROWS_MIN,
        });
    }

    if (data.droppedCount / total > DROPPED_RATIO_MAX) {
        return err({
            kind: "integrity_too_many_dropped",
            droppedCount: data.droppedCount,
            total,
            ratioMax: DROPPED_RATIO_MAX,
        });
    }

    return ok(data);
}
