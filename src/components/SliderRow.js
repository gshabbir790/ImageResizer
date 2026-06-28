import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default function SliderRow({ label, value, min, max, onChange, accentColor = '#0288d1' }) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
        <Text style={[styles.value, { color: accentColor }]}>{Math.round(value)}px</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        value={value}
        onValueChange={(v) => onChange(Math.round(v))}
        minimumTrackTintColor={accentColor}
        maximumTrackTintColor="#ddd"
        thumbTintColor={accentColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: { fontSize: 11, fontWeight: '600' },
  value: { fontSize: 11, fontWeight: '700' },
  slider: { width: '100%', height: 32 },
});
