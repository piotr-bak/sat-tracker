import { ROWS_MAX } from "@/core/shared/constants";
import { OmmSchema } from "@/core/shared/omm/schemas";
import { z } from "zod";

export const SnapshotSchema = z.object({
    schemaVer: z.literal(1),
    fetchedAtMs: z.number().int().positive(),
    rows: z.array(OmmSchema).max(ROWS_MAX),
});

export type Snapshot = z.infer<typeof SnapshotSchema>;
