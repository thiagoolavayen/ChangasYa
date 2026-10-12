import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import { getSocket } from '../api/socket';

export default function WorkerRequestScreen({ route, navigation }) {
  const { changa } = route.params; // { requestId, trade, userLat, userLng, distanceKm }
  const [taken, setTaken] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    function onNoDisponible({ requestId }) {
      if (requestId === changa.requestId) setTaken(true);
    }
    socket.on('changa_no_disponible', onNoDisponible);
    return () => socket.off('changa_no_disponible', onNoDisponible);
  }, []);

  async function handleAccept() {
    try {
      await api.post(`/requests/${changa.requestId}/accept`);
      Alert.alert('¡Changa aceptada!', 'Compartí tu ubicación con el cliente en camino.');
      navigation.goBack();
    } catch (err) {
      if (err.response?.status === 409) {
        setTaken(true);
      } else {
        Alert.alert('Error', 'No se pudo aceptar la changa.');
      }
    }
  }

  if (taken) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Esta changa ya fue tomada</Text>
        <Text style={styles.subtitle}>Otro trabajador la aceptó antes. ¡Va a llegar la próxima!</Text>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonSecondaryText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Nueva changa de {changa.trade}</Text>
      <Text style={styles.subtitle}>Distancia aproximada: {changa.distanceKm} km</Text>

      <TouchableOpacity style={styles.buttonAccept} onPress={handleAccept}>
        <Text style={styles.buttonText}>Aceptar changa</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonSecondaryText}>Ignorar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 30 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textLight, marginTop: 10, marginBottom: 30, textAlign: 'center' },
  buttonAccept: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 17 },
  buttonSecondary: { paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  buttonSecondaryText: { color: colors.textLight, fontWeight: '600' },
});
