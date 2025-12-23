"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for Geolocation API
 * Get user's location for routing and location-based features
 */
export function useGeolocation(options = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof navigator !== "undefined" && "geolocation" in navigator
    );
  }, []);

  /**
   * Get current position once
   * @param {Object} opts - Geolocation options
   * @param {boolean} [opts.enableHighAccuracy=true] - Request high accuracy
   * @param {number} [opts.timeout=10000] - Timeout in ms
   * @param {number} [opts.maximumAge=0] - Maximum cached position age
   */
  const getCurrentPosition = useCallback(async (opts = {}) => {
    if (!isSupported) {
      return {
        success: false,
        error: "Geolocation not supported",
      };
    }

    const geoOptions = {
      enableHighAccuracy: opts.enableHighAccuracy !== false,
      timeout: opts.timeout || 10000,
      maximumAge: opts.maximumAge || 0,
    };

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };

          setLocation(locationData);
          setLoading(false);
          resolve({ success: true, location: locationData });
        },
        (err) => {
          const errorMessage = {
            1: "Location permission denied",
            2: "Location unavailable",
            3: "Location request timeout",
          }[err.code] || "Unknown geolocation error";

          setError(errorMessage);
          setLoading(false);
          resolve({ success: false, error: errorMessage, code: err.code });
        },
        geoOptions
      );
    });
  }, [isSupported]);

  /**
   * Watch position continuously
   * @param {Function} callback - Called with position updates
   * @param {Object} opts - Geolocation options
   */
  const watchPosition = useCallback((callback, opts = {}) => {
    if (!isSupported) {
      return null;
    }

    const geoOptions = {
      enableHighAccuracy: opts.enableHighAccuracy !== false,
      timeout: opts.timeout || 10000,
      maximumAge: opts.maximumAge || 0,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };

        setLocation(locationData);
        callback({ success: true, location: locationData });
      },
      (err) => {
        const errorMessage = {
          1: "Location permission denied",
          2: "Location unavailable",
          3: "Location request timeout",
        }[err.code] || "Unknown geolocation error";

        setError(errorMessage);
        callback({ success: false, error: errorMessage, code: err.code });
      },
      geoOptions
    );

    return watchId;
  }, [isSupported]);

  /**
   * Stop watching position
   * @param {number} watchId - Watch ID from watchPosition
   */
  const clearWatch = useCallback((watchId) => {
    if (isSupported && watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, [isSupported]);

  /**
   * Calculate distance between two coordinates (in km)
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return {
    getCurrentPosition,
    watchPosition,
    clearWatch,
    calculateDistance,
    location,
    error,
    loading,
    isSupported,
  };
}
