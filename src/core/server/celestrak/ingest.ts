import "server-only";
import Papa from "papaparse";
import { z } from "zod";
import { CsvError } from "../errors";
import { ok, err, Result } from "../../shared/result";
import { OmmRecord, OmmSchema } from "@/core/shared/schemas";
import { IntegrityError } from "../errors";
import { ROWS_MIN, ROWS_MAX, DROPPED_RATIO_MAX } from "../../shared/constants";

export function parseCsv(
    csv: string,
    required: readonly string[],
): Result<readonly unknown[], CsvError> {
    const parsed = Papa.parse<unknown>(csv, {
        header: true,
        delimiter: ",",
        skipEmptyLines: true,
        preview: ROWS_MAX + 1,
    });

    const structuralErr = parsed.errors.filter(
        (error) => error.type !== "FieldMismatch",
    );
    if (structuralErr.length > 0)
        return err({
            kind: "csv_malformed",
            issues: structuralErr.map((error) => error.message),
        });

    const missingCol = required.filter(
        (name) => !parsed.meta.fields?.includes(name),
    );
    if (missingCol.length > 0)
        return err({
            kind: "csv_missing_columns",
            columns: missingCol,
        });

    if (parsed.data.length > ROWS_MAX)
        return err({
            kind: "csv_too_many_rows",
            rowsMax: ROWS_MAX,
        });

    return ok(parsed.data);
}

type ValidatedCelesTrakData = { rows: OmmRecord[]; droppedCount: number };

export function validate(data: readonly unknown[]): ValidatedCelesTrakData {
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
    data: ValidatedCelesTrakData,
): Result<ValidatedCelesTrakData, IntegrityError> {
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
