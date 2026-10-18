import { FETCH_TIMEOUT_MS } from "@/core/shared/constants";

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

function loadSnapshot() {}
