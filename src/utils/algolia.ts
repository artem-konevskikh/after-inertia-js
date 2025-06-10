import { AlgoliaResponse, BoundingBox, Config } from "../types/types";
import { calculateBbox } from "./utils";


export async function makeAlgoliaRequest(
    bbox: BoundingBox,
    config: Config
): Promise<AlgoliaResponse | null> {
    const url = `https://${config.app_id.toLowerCase()}-dsn.algolia.net/1/indexes/capture_popular/query`;
    
    const payload = {
        query: "",
        insideBoundingBox: [[bbox.lat_min, bbox.lon_min, bbox.lat_max, bbox.lon_max]],
        filters: "mode:splat",
        offset: 0,
        length: config.max_results_count,
    };

    const headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Type": "application/json",
        "Host": `${config.app_id.toLowerCase()}-dsn.algolia.net`,
        "Origin": "https://poly.cam",
        "Pragma": "no-cache",
        "Referer": "https://poly.cam/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "x-algolia-api-key": config.api_key,
        "x-algolia-application-id": config.app_id,
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.default_timeout_seconds * 1000);

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Algolia request failed:", error);
        return null;
    }
}

export async function getSplat(lat: number, lon: number, config: Config): Promise<string | null> {
    try {
        // Calculate bounding box
        const bbox = await calculateBbox(lat, lon, config);

        // Make Algolia request
        const data = await makeAlgoliaRequest(bbox, config);
        if (!data || !data.hits || data.hits.length === 0) {
            throw new Error("No splats found in the specified area");
        }
        // Get random splat
        const splat = data.hits[Math.floor(Math.random() * data.hits.length)];
        return splat.splatPly;
    } catch (error) {
        console.error("Error in getSplat:", error);
        throw error;
    }
}