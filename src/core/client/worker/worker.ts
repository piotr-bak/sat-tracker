import { FETCH_TIMEOUT_MS } from "@/core/shared/constants";
import { err, ok, Result } from "@/core/shared/result";
import { OmmRecord } from "@/core/shared/omm/schemas";
import {
    degreesLat,
    degreesLong,
    eciToGeodetic,
    gstime,
    json2satrec,
    propagate,
    SatRec,
    SatRecError,
} from "satellite.js";
import { SatRecProcessingError } from "./errors";
import { Frame, ProcessedSatRecData } from "./types";

async function fetchData(url: string): Promise<string> {
    const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);

    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new Error(
            `[PROCESSOR WORKER] Error fetching data. HTTP ${response.status}: ${response.statusText}`,
        );
    }

    return response.text();
}

function buildSatelliteRecords(
    data: readonly OmmRecord[],
): Result<ProcessedSatRecData, SatRecProcessingError> {
    if (data.length === 0) {
        return err({
            message: "[PROCESSOR WORKER] No OMM satellite data provided.",
        });
    }

    const satRecData: SatRec[] = [];
    const satIds: Int32Array = new Int32Array(data.length);

    for (const item of data) {
        const processed = json2satrec(item);

        if (processed.error !== SatRecError.None) continue;

        satIds[satRecData.length] = item.NORAD_CAT_ID;
        satRecData.push(processed);
    }

    if (satRecData.length === 0) {
        return err({ message: "[PROCESSOR WORKER] Zero valid satellites." });
    }

    const invalidSatCount = data.length - satRecData.length;
    const validSatIds: Int32Array = satIds.slice(0, satRecData.length);

    return ok({
        satRecData,
        validSatIds,
        invalidSatCount,
    });
}

// Computes one frame: the longitude, latitude and altitude of every satellite at `epoch`.
// Slot `i` of both arrays belongs to satRecData[i] and the main thread maps picks back
// to a NORAD id through validSatIds[i]. Nothing here may reorder or skip slots.
// Both arrays are allocated on every call: they are transferred to the main thread (which detaches them
// here) and a new typed array starts zeroed, so every satellite is hidden until it propagates successfully.
function computeFrame(satRecData: readonly SatRec[], epoch: Date): Frame {
    const satPositions = new Float32Array(satRecData.length * 3);
    const visibilityMask = new Uint8Array(satRecData.length);

    const gmst = gstime(epoch);
    let failedPropagationCount = 0;

    for (const [i, satRec] of satRecData.entries()) {
        const positionAndVelocity = propagate(satRec, epoch);

        if (!positionAndVelocity) {
            // SGP4 failed for this satellite at this epoch (satRec.error has the reason) and it may
            // succeed at another epoch. Its slots stay zero and its mask stays 0, so the layer does not
            // draw it at [0, 0, 0]. It is only counted - for diagnostics.
            failedPropagationCount++;
            continue;
        }

        const positionGd = eciToGeodetic(positionAndVelocity.position, gmst);

        // eciToGeodetic returns radians and kilometres; deck.gl wants degrees and metres.
        const offset = i * 3;
        satPositions[offset] = degreesLong(positionGd.longitude);
        satPositions[offset + 1] = degreesLat(positionGd.latitude);
        satPositions[offset + 2] = positionGd.height * 1000;

        visibilityMask[i] = 1;
    }

    return { satPositions, visibilityMask, failedPropagationCount };
}

function loadSnapshot() {}
