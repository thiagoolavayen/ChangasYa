import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Switch, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { getSocket, identify } from '../api/socket';

export default function WorkerHomeScreen({ navigation }) {
  const { worker } = useAuth();
  const { requestLocation } = useLocation();
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    identify('worker', worker.id);
    const socket = getSocket();

    function onNuevaChanga(payload) {
      // Le mostramos al trabajador la changa entrante para que decida aceptarla
      navigation.navigate('WorkerRequest', { changa: payload });
    }

    socket.on('nueva_changa', onNuevaChanga);
    return () => socket.off('nueva_changa', onNuevaChanga);
  }, []);

  async function toggleAvailability(value) {
    setLoading(true);
    try {
      let coords = null;
      if (value) {
        coords = await requestLocation();
        if (!coords) {
          setLoading(false);
          return;
        }
      }
      await api.patch('/workers/availability', {
        isAvailable: value,
        lat: coords?.lat,
        lng: coords?.lng,
      });
      setIsAvailable(value);
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar tu disponibilidad.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hola, {worker.name} 👋</Text>
      <Text style={styles.subtitle}>
        {isAvailable ? 'Estás disponible para recibir changas' : 'Estás desconectado'}
      </Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Quiero trabajar</Text>
        <Switch
          value={isAvailable}
          onValueChange={toggleAvailability}
          disabled={loading}
          trackColor={{ true: colors.primary, false: '#ccc' }}
        />
      </View>

      <Text style={styles.hint}>
        Cuando esté activado vas a recibir avisos de changas cercanas. El primero en aceptar se la
        queda, así que ¡estate atento a la notificación!
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textLight, marginTop: 6, marginBottom: 30 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 18, borderRadius: 16 },
  switchLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.textLight, marginTop: 20, lineHeight: 18 },
});
