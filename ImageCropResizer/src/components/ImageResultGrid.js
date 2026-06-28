import React from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = (SCREEN_W - 24 - 12) / 2; // 2 col, 12px padding each side, 12px gap

export default function ImageResultGrid({ files, onRename }) {
  return (
    <View style={styles.grid}>
      {files.map((file, idx) => (
        <View key={idx} style={styles.card}>
          <Image
            source={{ uri: file.uri }}
            style={styles.thumb}
            resizeMode="cover"
          />
          <Text style={styles.name} numberOfLines={1}>
            {file.customName || file.defaultName}
          </Text>
          <Text style={styles.size}>{file.sizeText}</Text>
          <TextInput
            style={styles.renameInput}
            placeholder="Rename..."
            placeholderTextColor="#aaa"
            value={file.customName}
            onChangeText={(text) => onRename(idx, text)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 2,
  },
  card: {
    width: CARD_W,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  thumb: {
    width: CARD_W - 16,
    height: 130,
    borderRadius: 5,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  name: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  size: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 5,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#008cba',
    borderRadius: 5,
    padding: 5,
    width: '100%',
    textAlign: 'center',
    fontSize: 10,
    color: '#333',
  },
});
