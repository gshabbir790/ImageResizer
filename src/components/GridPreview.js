import React, { useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';

const SCREEN_W = Dimensions.get('window').width - 24; // account for padding

export default function GridPreview({
  imageUri,
  imageWidth,
  imageHeight,
  rows,
  cols,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  rowSpacing,
  colSpacing,
}) {
  // Scale the preview to fit screen width
  const previewW = SCREEN_W - 4; // border
  const scale = imageWidth > 0 ? previewW / imageWidth : 1;
  const previewH = imageHeight * scale;

  const lines = useMemo(() => {
    if (!imageWidth || !imageHeight) return [];
    const result = [];

    const activeW = imageWidth - marginLeft - marginRight;
    const activeH = imageHeight - marginTop - marginBottom;
    const cellW = (activeW - (cols - 1) * colSpacing) / cols;
    const cellH = (activeH - (rows - 1) * rowSpacing) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (marginLeft + c * (cellW + colSpacing)) * scale;
        const y = (marginTop + r * (cellH + rowSpacing)) * scale;
        const w = cellW * scale;
        const h = cellH * scale;
        result.push({ x, y, w, h, key: `${r}-${c}` });
      }
    }
    return result;
  }, [imageWidth, imageHeight, rows, cols, marginTop, marginBottom, marginLeft, marginRight, rowSpacing, colSpacing, scale]);

  if (!imageUri) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Grid Preview</Text>
      <View style={[styles.previewWrap, { width: previewW, height: previewH }]}>
        <Image
          source={{ uri: imageUri }}
          style={{ width: previewW, height: previewH }}
          resizeMode="stretch"
        />
        <Svg
          style={StyleSheet.absoluteFill}
          width={previewW}
          height={previewH}
        >
          {lines.map(({ x, y, w, h, key }) => (
            <Rect
              key={key}
              x={x}
              y={y}
              width={w}
              height={h}
              stroke="red"
              strokeWidth={Math.max(1, previewW * 0.002)}
              fill="transparent"
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', color: '#1976d2', marginBottom: 4 },
  previewWrap: {
    borderWidth: 2,
    borderColor: '#2196f3',
    borderStyle: 'dashed',
    borderRadius: 6,
    overflow: 'hidden',
  },
});
