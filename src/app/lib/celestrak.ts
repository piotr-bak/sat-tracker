import Papa from 'papaparse';
import { CsvError } from "./types/csvError";
import { ok, err, Result } from "./types/result";

export async function fetchCelesTrakData(): Promise<string> {    
    const baseUrl = process.env.CELESTRAK_BASE_URL;

    if (!baseUrl) {
        throw new Error(
            'Failed to fetch CelesTrak data. CelesTrak base URL is not configured'
        );
    }
    
    const url = new URL(baseUrl);
    url.searchParams.set('GROUP', 'active');
    url.searchParams.set('FORMAT', 'csv');

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch CelesTrak data. Error ${response.status}: ${response.statusText}`
        )
    }

    return response.text();
}

const ROWS_MAX = 100_000;

export function parseCelesTrakCsv(csv: string, required: readonly string[]): Result<readonly unknown[], CsvError> {
    const parsed = Papa.parse<unknown>(csv, {
        header: true,
        delimiter: ',',
        skipEmptyLines: true,
        preview: ROWS_MAX + 1
    });

    const structuralErr = parsed.errors.filter((error) => error.type !== 'FieldMismatch');
    if (structuralErr.length > 0) return err({
        kind: 'csv_malformed',
        issues: structuralErr.map((error) => error.message);
    })

    const missingCol = required.filter((name) => !parsed.meta.fields?.includes(name));  
    if (missingCol.length > 0) return err({
        kind: "csv_missing_columns", 
        columns: missingCol,
    })

    if (parsed.data.length > ROWS_MAX) return err({
        kind: "csv_too_many_rows",
        rowsMax: ROWS_MAX,
    })

    return ok(parsed.data);
}