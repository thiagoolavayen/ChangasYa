import React, { createContext, useContext, useState, useCallback } from 'react';
import * as Location from 'expo-location';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null); // { lat, lng }
  const [errorMsg, setErrorMsg] = useState(null);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Se necesita permiso de ubicación para poder llamar a un profesional.');
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({});
    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setLocation(coords);
    return coords;
  }, []);

  return (
    <LocationContext.Provider value={{ location, errorMsg, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
