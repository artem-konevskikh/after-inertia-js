import { BoundingBox, Config, City, Coordinates } from '../types/types';

export async function calculateBbox(lat: number, lon: number, config: Config): Promise<BoundingBox> {
    // Convert kilometers to degrees
    const sizeDeg = config.default_size_km / config.km_per_degree;

    // Calculate min/max lat/lon
    const latMin = lat - sizeDeg;
    const latMax = lat + sizeDeg;
    const lonMin = lon - (sizeDeg / Math.cos((lat * Math.PI) / 180));
    const lonMax = lon + (sizeDeg / Math.cos((lat * Math.PI) / 180));

    return {
        lat_min: latMin,
        lon_min: lonMin,
        lat_max: latMax,
        lon_max: lonMax,
    };
}

export function getRandomCity(cities: City[]): City {
    return cities[Math.floor(Math.random() * cities.length)];
}

export function shiftCoordinates(city: City, minKm: number = 10, maxKm: number = 50): Coordinates {
    // Generate random distance and angle
    const distance = Math.random() * (maxKm - minKm) + minKm;
    const angle = Math.random() * 2 * Math.PI;

    // Convert distance to degrees (approximate)
    const kmPerDegree = 111; // Approximate km per degree at equator
    const deltaLat = (distance * Math.cos(angle)) / kmPerDegree;
    const deltaLon = (distance * Math.sin(angle)) / (kmPerDegree * Math.cos((city.lat * Math.PI) / 180));

    return {
        lat: city.lat + deltaLat,
        lon: city.lon + deltaLon,
    };
}



export function getRandomInterval(): number {
    // Return random interval between 60 seconds (1 minute) and 180 seconds (3 minutes)
    return Math.floor(Math.random() * (180 - 60 + 1) + 60) * 1000;
}