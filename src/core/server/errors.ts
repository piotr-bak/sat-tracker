import type { IntegrityError } from "../shared/omm/errors";

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
      };

export type RefreshError =
    | {
          readonly kind: "upstream_failed";
          readonly message: string;
      }
    | CsvError
    | IntegrityError
    | BlobStoreError;
