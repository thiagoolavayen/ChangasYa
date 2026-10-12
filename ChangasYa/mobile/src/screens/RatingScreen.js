import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function RatingScreen({ route, navigation }) {
  const { requestId, workerName } = route.params;
  const { user } = useAuth();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  async function submit() {
    if (stars === 0) {
      Alert.alert('Elegí una calificación', 'Tocá al menos una estrella.');
      return;
    }
    try {
      await api.post('/ratings', { requestId, userId: user.id, stars, comment });
      navigation.popToTop();
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar la calificación.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>¿Cómo te fue con {workerName || 'el trabajador'}?</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setStars(n)}>
            <Ionicons
              name={n <= stars ? 'star' : 'star-outline'}
              size={40}
              color={colors.primary}
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Dejá un comentario (opcional)"
        value={comment}
        onChangeText={setComment}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Enviar calificación</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 30, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 20 },
  stars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: colors.primaryLight, borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  button: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
