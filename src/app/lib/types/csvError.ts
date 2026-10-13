export type CsvError = 
    | { readonly kind: "csv_missing_columns"; readonly columns: readonly string[] }
    | { readonly kind: "csv_malformed"; readonly issues: readonly string[] }
    | { readonly kind: "csv_too_many_rows"; readonly rowsMax: number }