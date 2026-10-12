import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { api } from './src/api/client';
import { colors } from './src/theme/colors';

// El "login" del usuario (cliente) es simplemente identificar el teléfono del dispositivo,
// sin pantalla de registro. En un dispositivo real se puede usar expo-contacts / SIM info,
// o simplemente pedirlo una vez la primera vez que se abre la app y guardarlo en almacenamiento local.
function Bootstrap({ children }) {
  const { loginUser, user } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      // TODO: reemplazar por el teléfono real guardado en AsyncStorage / SecureStore
      const rawId = Device.osInternalBuildId || 'simulado';
      const shortId = rawId.slice(-10); // nos quedamos con los últimos 10 caracteres
      const phone = `dev-${shortId}`;   // máximo 14 caracteres, entra en varchar(30)
      try {
        const { data } = await api.post('/auth/user/login', { phone });
        loginUser(data.user);
      } catch (err) {
        console.warn('No se pudo iniciar sesión de usuario:', err.message);
      } finally {
        setReady(true);
      }
    }
    bootstrap();
  }, []);

  if (!ready || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <Bootstrap>
          <StatusBar style="dark" />
          <AppNavigator />
        </Bootstrap>
      </LocationProvider>
    </AuthProvider>
  );
}