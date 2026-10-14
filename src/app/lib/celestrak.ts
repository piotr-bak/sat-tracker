import Papa from 'papaparse';
import {z} from 'zod';
import { CsvError } from "./types/errors";
import { ok, err, Result } from "./types/result";
import { OmmRecord, OmmSchema } from './schemas';
import { IntegrityError } from './types/errors';

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

const ROWS_MIN = 1000
const DROPPED_RATIO_MAX = 0.02

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