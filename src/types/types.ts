export interface Coordinates {
    lat: number;
    lon: number;
}

export interface City {
    name: string;
    lat: number;
    lon: number;
}

export interface BoundingBox {
    lat_min: number;
    lon_min: number;
    lat_max: number;
    lon_max: number;
}

export interface Config {
    default_size_km: number;
    km_per_degree: number;
    app_id: string;
    api_key: string;
    default_timeout_seconds: number;
    max_results_count: number;
    min_refresh_interval_seconds: number;
    max_refresh_interval_seconds: number;
}

export interface AlgoliaHit {
    objectID: string;
    splat: string;
    [key: string]: any;
}

export interface AlgoliaResponse {
    hits: AlgoliaHit[];
    [key: string]: any;
}