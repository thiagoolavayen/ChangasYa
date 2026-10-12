import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getSocket, identify } from '../api/socket';

export default function RequestWaitingScreen({ route, navigation }) {
  const { requestId, tradeName } = route.params;
  const { user } = useAuth();
  const [status, setStatus] = useState('buscando'); // buscando | asignada | sin_trabajadores
  const [worker, setWorker] = useState(null);

  useEffect(() => {
    identify('user', user.id);
    const socket = getSocket();
    socket.emit('join_request', { requestId });

    function onAsignado({ requestId: rid, worker: w }) {
      if (rid !== requestId) return;
      setStatus('asignada');
      setWorker(w);
    }
    function onSinTrabajadores({ requestId: rid }) {
      if (rid !== requestId) return;
      setStatus('sin_trabajadores');
    }
    function onEstado({ requestId: rid, status: s }) {
      if (rid !== requestId) return;
      if (s === 'finalizada') {
        navigation.replace('Rating', { requestId, workerName: worker?.name });
      }
    }

    socket.on('trabajador_asignado', onAsignado);
    socket.on('sin_trabajadores', onSinTrabajadores);
    socket.on('estado_changa', onEstado);

    return () => {
      socket.off('trabajador_asignado', onAsignado);
      socket.off('sin_trabajadores', onSinTrabajadores);
      socket.off('estado_changa', onEstado);
    };
  }, [requestId]);

  if (status === 'sin_trabajadores') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>No encontramos a nadie 😕</Text>
        <Text style={styles.subtitle}>
          No hay trabajadores de {tradeName} disponibles cerca tuyo en este momento.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (status === 'asignada' && worker) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>¡{worker.name} va en camino! 🎉</Text>
        <Text style={styles.subtitle}>Calificación: ⭐ {worker.rating}</Text>
        <Text style={styles.subtitle}>Teléfono: {worker.phone}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.popToTop()}>
          <Text style={styles.buttonText}>Listo</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.title}>Buscando a un profesional de {tradeName}...</Text>
      <Text style={styles.subtitle}>Estamos avisando a los trabajadores más cercanos.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 30 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textLight, marginTop: 10, textAlign: 'center' },
  button: { marginTop: 30, backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
