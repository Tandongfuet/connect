import { useState } from 'react';
import { cities, type CityData } from '../services/locationData';

type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error';

interface GeolocationState {
    status: GeolocationStatus;
    city: string | null;
    region: string | null;
    error: string | null;
}

// Haversine formula to calculate distance between two lat/lon points
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};


export const useGeolocation = () => {
    const [state, setState] = useState<GeolocationState>({ status: 'idle', city: null, region: null, error: null });

    const findNearestCity = (lat: number, lon: number): CityData => {
        let nearestCity = cities[0];
        let minDistance = Infinity;

        cities.forEach(city => {
            const distance = getDistance(lat, lon, city.lat, city.lon);
            if (distance < minDistance) {
                minDistance = distance;
                nearestCity = city;
            }
        });
        return nearestCity;
    };
    
    const getLocation = () => {
        if (!navigator.geolocation) {
            setState({ status: 'error', city: null, region: null, error: 'Geolocation is not supported by your browser.' });
            return;
        }

        setState({ status: 'loading', city: null, region: null, error: null });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const nearestCity = findNearestCity(latitude, longitude);
                setState({ status: 'success', city: nearestCity.name, region: nearestCity.region, error: null });
            },
            (error) => {
                let errorMessage = 'An unknown error occurred.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'You denied the request for Geolocation.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'The request to get user location timed out.';
                        break;
                }
                setState({ status: 'error', city: null, region: null, error: errorMessage });
            }
        );
    };

    return { ...state, getLocation };
};