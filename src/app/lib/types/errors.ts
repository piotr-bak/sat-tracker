export type CsvError = 
    | { 
        readonly kind: "csv_missing_columns"; 
        readonly columns: readonly string[];
      }
    | { 
        readonly kind: "csv_malformed"; 
        readonly issues: readonly string[];
      }
    | { 
        readonly kind: "csv_too_many_rows"; 
        readonly rowsMax: number;
    }

export type IntegrityError =
    | {
        readonly kind: "integrity_row_count_too_low";
        readonly rowCount: number;
        readonly min: number;
      }
    | {
        readonly kind: "integrity_too_many_dropped";
        readonly droppedCount: number;
        readonly total: number;
        readonly ratioMax: number;
      };

export type BlobStoreError = 
    | { 
        readonly kind: "blob_write_failed"; 
        readonly cause: unknown;
      }
    | {
        readonly kind: "blob_read_failed";
        readonly cause: unknown;
      }
    | {
        readonly kind: "blob_invalid_snapshot";
        readonly issues: readonly string[];
    }
