import { Config } from '../types/types';

export const defaultConfig: Config = {
    default_size_km: 50.0,
    km_per_degree: 111.0,
    app_id: import.meta.env.VITE_ALGOLIA_APP_ID || 'default_app_id',
    api_key: import.meta.env.VITE_ALGOLIA_API_KEY || 'default_api_key',
    default_timeout_seconds: 30,
    max_results_count: 50,
    min_refresh_interval_seconds: 30,
    max_refresh_interval_seconds: 120,
};