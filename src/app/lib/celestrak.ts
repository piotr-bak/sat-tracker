import Papa from 'papaparse';
import {z} from 'zod';
import { CsvError } from "./types/errors";
import { ok, err, Result } from "./types/result";
import { OmmRecord, OmmSchema } from './schemas';
import { IntegrityError } from './types/errors';
import { ROWS_MIN, ROWS_MAX, DROPPED_RATIO_MAX, FETCH_TIMEOUT_MS } from './constants';

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

    const response = await fetch(url, {
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "User-Agent": "sat-tracker-demo (github.com/piotr-bak)"}
    });

    // status != 200 instead of !ok is to match CelesTrak rule 
    // to stop on anything but 200. `ok` would also accept 204 etc.
    if (response.status !== 200) { 

        // 403 form CelesTrak may include a sentence explaining the reason why getting blocked. 
        // Keeping first characters of the sentence could give something to act upon
        const hint = (await response.text()).slice(0, 250);
        throw new Error(
            `CelesTrak responded with Status ${response.status}: ${hint}`
        )
    }

    return response.text();
}

export function parseCsv(csv: string, required: readonly string[]): Result<readonly unknown[], CsvError> {
    const parsed = Papa.parse<unknown>(csv, {
        header: true,
        delimiter: ',',
        skipEmptyLines: true,
        preview: ROWS_MAX + 1
    });

    const structuralErr = parsed.errors.filter((error) => error.type !== 'FieldMismatch');
    if (structuralErr.length > 0) return err({
        kind: 'csv_malformed',
        issues: structuralErr.map((error) => error.message)
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

type ValidatedCelesTrakData = { rows: OmmRecord[], droppedCount: number }

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
        droppedCount: droppedCount
    }
}

export function checkIntegrity(data: ValidatedCelesTrakData): Result<ValidatedCelesTrakData, IntegrityError> {
    const rowCount = data.rows.length;
    const total = rowCount + data.droppedCount;

    if (rowCount < ROWS_MIN) {
        return err( { kind: 'integrity_row_count_too_low', rowCount, min: ROWS_MIN } );
    }

    if (data.droppedCount / total > DROPPED_RATIO_MAX ) {
        return err( { kind: 'integrity_too_many_dropped', droppedCount: data.droppedCount, total, ratioMax: DROPPED_RATIO_MAX } );
    }

    return ok(data);
    
}