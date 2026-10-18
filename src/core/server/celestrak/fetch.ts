import { FETCH_TIMEOUT_MS } from "@/core/shared/constants";
import { readFile } from "node:fs/promises";

export async function fetchCelesTrakData(): Promise<string> {
    // Prevent local runs from calling the real CelesTrak endpoint
    if (process.env.VERCEL_ENV !== "production") {
        return readFile(
            process.env.GP_FIXTURE_PATH ?? "fixtures/gp-active.csv",
            "utf8",
        );
    }

    const baseUrl = process.env.CELESTRAK_BASE_URL;

    if (!baseUrl) {
        throw new Error(
            "Failed to fetch CelesTrak data. CelesTrak base URL is not configured",
        );
    }

    const url = new URL(baseUrl);
    url.searchParams.set("GROUP", "active");
    url.searchParams.set("FORMAT", "csv");

    const response = await fetch(url, {
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "User-Agent": "sat-tracker-demo (github.com/piotr-bak)" },
    });

    // status != 200 instead of !ok is to match CelesTrak rule
    // to stop on anything but 200. `ok` would also accept 204 etc.
    if (response.status !== 200) {
        // 403 form CelesTrak may include a sentence explaining the reason why getting blocked.
        // Keeping first characters of the sentence could give something to act upon
        const hint = (await response.text()).slice(0, 250);
        throw new Error(
            `CelesTrak responded with Status ${response.status}: ${hint}`,
        );
    }

    return response.text();
}
