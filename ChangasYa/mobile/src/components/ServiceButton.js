import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Mapeo simple de nombre de oficio -> ícono de Ionicons
const ICONS = {
  Gomeria: 'car-sport-outline',
  Plomeria: 'water-outline',
  Cerrajista: 'key-outline',
  Electricista: 'flash-outline',
};

export default function ServiceButton({ label, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Ionicons name={ICONS[label] || 'construct-outline'} size={40} color={colors.white} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: '46%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '2%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  disabled: {
    backgroundColor: colors.primaryLight,
  },
  label: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 8,
  },
});
