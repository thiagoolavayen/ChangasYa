import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function WorkerRegisterScreen({ navigation }) {
  const { loginWorker } = useAuth();
  const [trades, setTrades] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [tradeId, setTradeId] = useState(null);

  useEffect(() => {
    api.get('/workers/trades').then((res) => {
      setTrades(res.data.trades);
      if (res.data.trades[0]) setTradeId(res.data.trades[0].id);
    });
  }, []);

  async function handleRegister() {
    if (!name || !phone || !password || !tradeId) {
      Alert.alert('Faltan datos', 'Completá todos los campos obligatorios.');
      return;
    }
    try {
      const { data } = await api.post('/auth/worker/register', { name, phone, dni, password, tradeId });
      loginWorker(data.worker, data.token);
      navigation.replace('WorkerHome');
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo completar el registro.';
      Alert.alert('Error', msg);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.title}>Registrate como trabajador</Text>

        <Text style={styles.label}>Nombre y apellido</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Juan Pérez" />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="2494..." />

        <Text style={styles.label}>DNI (opcional)</Text>
        <TextInput style={styles.input} value={dni} onChangeText={setDni} keyboardType="numeric" />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.label}>Oficio</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={tradeId} onValueChange={setTradeId}>
            {trades.map((t) => (
              <Picker.Item key={t.id} label={t.name} value={t.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarme</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '800', color: colors.primary, marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 13, color: colors.textLight, marginTop: 12, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.primaryLight, borderRadius: 10, padding: 12 },
  pickerWrapper: { borderWidth: 1, borderColor: colors.primaryLight, borderRadius: 10 },
  button: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 28 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
