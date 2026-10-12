import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import ServiceButton from '../components/ServiceButton';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

const TRADES = ['Gomeria', 'Plomeria', 'Cerrajista', 'Electricista'];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { requestLocation } = useLocation();
  const [tradesFromApi, setTradesFromApi] = useState([]);

  useEffect(() => {
    // Traemos los ids reales de los oficios desde el backend
    api.get('/workers/trades').then((res) => setTradesFromApi(res.data.trades)).catch(() => {});
  }, []);

  async function handlePressTrade(tradeName) {
    const coords = await requestLocation();
    if (!coords) {
      Alert.alert('Ubicación requerida', 'Activá el permiso de ubicación para continuar.');
      return;
    }
    const trade = tradesFromApi.find((t) => t.name === tradeName);
    if (!trade) {
      Alert.alert('Error', 'No se pudo identificar el oficio. Probá de nuevo en un momento.');
      return;
    }

    try {
      const { data } = await api.post('/requests', {
        userId: user.id,
        tradeId: trade.id,
        lat: coords.lat,
        lng: coords.lng,
      });
      navigation.navigate('RequestWaiting', { requestId: data.request.id, tradeName });
    } catch (err) {
      Alert.alert('Error', 'No se pudo crear la solicitud. Intentá de nuevo.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ChangasYa</Text>
        <TouchableOpacity onPress={() => navigation.navigate('WorkerRegister')}>
          <Text style={styles.workerLink}>¿Desea trabajar para nosotros?</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>¿Qué necesitás hoy?</Text>

      <View style={styles.grid}>
        {TRADES.map((trade) => (
          <ServiceButton key={trade} label={trade} onPress={() => handlePressTrade(trade)} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  title: { fontSize: 26, fontWeight: '800', color: colors.primary },
  workerLink: { color: colors.primaryDark, fontSize: 12, fontWeight: '600', maxWidth: 120, textAlign: 'right' },
  subtitle: { fontSize: 18, color: colors.text, marginTop: 30, marginBottom: 10, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 },
});
