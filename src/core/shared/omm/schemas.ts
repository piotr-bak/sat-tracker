import { z } from 'zod';
import { ROWS_MAX } from '../constants';

export const OmmSchema = z.object({
    OBJECT_NAME: z.string().min(1),
    OBJECT_ID: z.string(),
    EPOCH: z.iso.datetime({ local: true, offset: true }),

    // Orbital elements
    MEAN_MOTION: z.coerce.number().positive(),
    ECCENTRICITY: z.coerce.number().min(0).lt(1),
    INCLINATION: z.coerce.number().min(0).max(180),
    RA_OF_ASC_NODE: z.coerce.number().min(0).max(360),
    ARG_OF_PERICENTER: z.coerce.number().min(0).max(360),
    MEAN_ANOMALY: z.coerce.number().min(0).max(360),

    // TLE-related
    EPHEMERIS_TYPE: z.coerce.number().pipe(z.literal(0)),
    CLASSIFICATION_TYPE: z.enum(['U', 'C']),
    NORAD_CAT_ID: z.coerce.number().int().positive(),
    ELEMENT_SET_NO: z.coerce.number().int().nonnegative(),
    REV_AT_EPOCH: z.coerce.number().int().nonnegative(),
    BSTAR: z.coerce.number(),
    MEAN_MOTION_DOT: z.coerce.number(),
    MEAN_MOTION_DDOT: z.coerce.number(),
});

export type OmmRecord = z.infer<typeof OmmSchema>;

const snapshotSchemaOf = <Row extends z.ZodType>(row: Row) =>
    z.object({
        schemaVer: z.literal(1),
        fetchedAtMs: z.number().int().positive(),
        rows: z.array(row).max(ROWS_MAX),
    });

export const SnapshotEnvelopeSchema = snapshotSchemaOf(z.unknown());
export const SnapshotSchema = snapshotSchemaOf(OmmSchema);

export type Snapshot = z.infer<typeof SnapshotSchema>;
