import React, { useState, useEffect, useCallback } from 'react';
import { Application } from '@playcanvas/react';
import SplatScene from '../components/SplatScene';
import { getRandomCity, shiftCoordinates } from '../utils/utils';
import { getSplat } from '../utils/algolia';
import { defaultConfig } from '../config/config';
import { biggestCities } from '../data/cities';
import { City } from '../types/types';

const SplatViewer: React.FC = () => {
  const [splatUrl, setSplatUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number } | null>(null);

  const loadRandomSplat = useCallback(async () => {
    setLoading(true);
    let url: string | null = null;

    try {
      while (!url) {
        // Choose random city
        const city = getRandomCity(biggestCities);
        setCurrentCity(city);

        // Shift coordinates randomly 0-10km
        const shiftedCoords = shiftCoordinates(city, 0, 10);
        setCurrentCoords(shiftedCoords);

        console.log(`Attempting to load splat near ${city.name} at shifted coords:`, shiftedCoords);

        // Get splat URL
        url = await getSplat(shiftedCoords.lat, shiftedCoords.lon, defaultConfig);

        if (url) {
          setSplatUrl(url);
          console.log('Loaded splat:', url);
        } else {
          console.log(`No splat found near ${city.name}, trying another location...`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error loading splat:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and timed refresh
  useEffect(() => {
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const getRandomInterval = () => {
      const min = defaultConfig.min_refresh_interval_seconds * 1000;
      const max = defaultConfig.max_refresh_interval_seconds * 1000;
      return Math.random() * (max - min) + min;
    };

    const loadAndSchedule = async () => {
      await loadRandomSplat();
      if (!isCancelled) {
        timeoutId = setTimeout(loadAndSchedule, getRandomInterval());
      }
    };

    loadAndSchedule();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [loadRandomSplat]);

  if (loading && !splatUrl) {
    return (
      <div className="w-full h-full relative bg-gray-900 flex items-center justify-center">
        {/* Loading spinner */}
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>

        {/* Location info overlay - also visible during loading */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="text-white">
            {currentCity && (
              <div className="text-2xl font-bold">{currentCity.name}</div>
            )}
            {currentCoords && (
              <div className="text-sm opacity-80">
                {currentCoords.lat.toFixed(4)}, {currentCoords.lon.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-gray-900">
      {/* Main splat scene - positioned to fill the container */}
      <Application className="absolute inset-0">
        <SplatScene splatUrl={splatUrl} />
      </Application>

      {/* Location info overlay - positioned on top */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="text-white">
          {currentCity && (
            <div className="text-2xl font-bold">{currentCity.name}</div>
          )}
          {currentCoords && (
            <div className="text-sm opacity-80">
              {currentCoords.lat.toFixed(4)}, {currentCoords.lon.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplatViewer;