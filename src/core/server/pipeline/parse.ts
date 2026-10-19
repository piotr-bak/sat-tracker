import "server-only";
import type { CsvError } from "../errors";
import Papa from "papaparse";
import { ROWS_MAX } from "../../shared/constants";
import { type Result, err, ok } from "../../shared/result";

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
        {return err({
            kind: "csv_malformed",
            issues: structuralErr.map((error) => error.message),
        });}

    const missingCol = required.filter(
        (name) => !parsed.meta.fields?.includes(name),
    );
    if (missingCol.length > 0)
        {return err({
            kind: "csv_missing_columns",
            columns: missingCol,
        });}

    if (parsed.data.length > ROWS_MAX)
        {return err({
            kind: "csv_too_many_rows",
            rowsMax: ROWS_MAX,
        });}

    return ok(parsed.data);
}
