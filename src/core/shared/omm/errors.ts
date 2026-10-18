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
