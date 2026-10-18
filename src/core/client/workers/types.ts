import { SatRec } from "satellite.js";

export type ProcessedSatRecData = {
    satRecData: SatRec[];
    validSatIds: Int32Array;
    invalidSatCount: number;
};

export type Frame = {
    satPositions: Float32Array; // [longitude (deg), latitude (deg), altitude (m)] per satellite
    visibilityMask: Uint8Array; // 1 = draw, 0 = hide
    failedPropagationCount: number;
};
