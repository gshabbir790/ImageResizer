/**
 * HomeScreen.js — Production-Ready
 * Features:
 *  - Runtime MediaLibrary + ImagePicker permission requests with clear UX
 *  - All expo-image-manipulator calls wrapped in try-catch with Alert feedback
 *  - Darood (welcome) + Jazakallah modal logic
 *  - Platform.select Urdu font fallbacks
 *  - Binary-search quality compression to hit target KB
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

import DaroodModal from '../components/DaroodModal';
import ImageResultGrid from '../components/ImageResultGrid';
import GridPreview from '../components/GridPreview';
import SliderRow from '../components/SliderRow';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Urdu font fallback ───────────────────────────────────────────────────────
// Use JameelNooriNastaleeq when bundled; fall back to best system alternative.
const URDU_FONT = Platform.select({
  android: 'JameelNooriNastaleeq', // will silently fall back to 'serif' if missing
  ios: 'GeezaPro',
  default: 'serif',
});

// ─── Permission helpers ───────────────────────────────────────────────────────
/**
 * Request camera-roll / media-library read permission.
 * Opens Settings if permanently denied.
 * @returns {boolean} true if granted
 */
async function requestMediaLibraryPermission() {
  const { status, canAskAgain } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status === 'granted') return true;

  if (!canAskAgain) {
    Alert.alert(
      'Permission Required',
      'Photo access is permanently denied. Please enable it in your device Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  } else {
    Alert.alert(
      'Permission Required',
      'Please allow photo access to pick images.',
    );
  }
  return false;
}

/**
 * Request MediaLibrary write permission (save to gallery).
 * @returns {boolean} true if granted
 */
async function requestSavePermission() {
  const { status, canAskAgain } =
    await MediaLibrary.requestPermissionsAsync();

  if (status === 'granted') return true;

  if (!canAskAgain) {
    Alert.alert(
      'Permission Required',
      'Gallery save access is permanently denied. Please enable it in your device Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  } else {
    Alert.alert(
      'Permission Required',
      'Please allow media library access to save images.',
    );
  }
  return false;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomeScreen() {
  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState('grid'); // 'grid' | 'multiple'

  // ── Target dimensions ─────────────────────────────────────────────────────
  const [targetW, setTargetW] = useState('600');
  const [targetH, setTargetH] = useState('800');
  const [targetKB, setTargetKB] = useState('23');

  // ── Grid settings ─────────────────────────────────────────────────────────
  const [gridRows, setGridRows] = useState('5');
  const [gridCols, setGridCols] = useState('4');
  const [marginTop, setMarginTop] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);
  const [marginRight, setMarginRight] = useState(0);
  const [rowSpacing, setRowSpacing] = useState(0);
  const [colSpacing, setColSpacing] = useState(0);

  // ── Source images ─────────────────────────────────────────────────────────
  const [gridImageUri, setGridImageUri] = useState(null);
  const [gridImageSize, setGridImageSize] = useState({ width: 0, height: 0 });
  const [multipleImages, setMultipleImages] = useState([]);

  // ── Processing state ──────────────────────────────────────────────────────
  const [processing, setProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [processingTime, setProcessingTime] = useState(null);

  // ── Welcome Darood modal ──────────────────────────────────────────────────
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [welcomeCount, setWelcomeCount] = useState(0);
  const [showWelcomeJazak, setShowWelcomeJazak] = useState(false);

  // ── Download Darood modal ─────────────────────────────────────────────────
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [showDownloadJazak, setShowDownloadJazak] = useState(false);
  const pendingDownloadRef = useRef(null);

  // ── Welcome modal logic ───────────────────────────────────────────────────
  const handleWelcomeCount = useCallback(() => {
    const next = welcomeCount + 1;
    setWelcomeCount(next);
    if (next >= 10) {
      setShowWelcomeJazak(true);
      setTimeout(() => {
        setShowWelcomeModal(false);
      }, 2000);
    }
  }, [welcomeCount]);

  // ── Download modal logic ──────────────────────────────────────────────────
  const handleDownloadCount = useCallback(async () => {
    const next = downloadCount + 1;
    setDownloadCount(next);
    if (next >= 2) {
      setShowDownloadJazak(true);
      setTimeout(async () => {
        setShowDownloadModal(false);
        setDownloadCount(0);
        setShowDownloadJazak(false);
        if (pendingDownloadRef.current) {
          await pendingDownloadRef.current();
          pendingDownloadRef.current = null;
        }
      }, 2000);
    }
  }, [downloadCount]);

  const triggerDownload = useCallback((downloadFn) => {
    pendingDownloadRef.current = downloadFn;
    setDownloadCount(0);
    setShowDownloadJazak(false);
    setShowDownloadModal(true);
  }, []);

  // ── Image picking ─────────────────────────────────────────────────────────
  const pickGridImage = useCallback(async () => {
    const granted = await requestMediaLibraryPermission();
    if (!granted) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setGridImageUri(asset.uri);
        setGridImageSize({ width: asset.width, height: asset.height });
        setProcessedFiles([]);
        setProcessingTime(null);
      }
    } catch (err) {
      Alert.alert('Image Picker Error', err.message || 'Could not open image picker.');
    }
  }, []);

  const pickMultipleImages = useCallback(async () => {
    const granted = await requestMediaLibraryPermission();
    if (!granted) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setMultipleImages(result.assets);
        setProcessedFiles([]);
        setProcessingTime(null);
      }
    } catch (err) {
      Alert.alert('Image Picker Error', err.message || 'Could not open image picker.');
    }
  }, []);

  // ── Core compression helper ───────────────────────────────────────────────
  /**
   * Binary-search JPEG quality to reach ≤ maxKB while keeping target dimensions.
   * Throws on manipulator failure so callers can catch and surface the error.
   */
  const compressToTargetKB = useCallback(async (uri, maxKB, tw, th) => {
    const maxKBNum = parseFloat(maxKB) || 23;
    let lo = 0.05;
    let hi = 0.95;
    let result = null;
    let sizeKB = Infinity;

    for (let i = 0; i < 10; i++) {
      const quality = (lo + hi) / 2;

      // Throws if manipulation fails — let caller handle
      result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: parseInt(tw, 10), height: parseInt(th, 10) } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
      );

      const info = await FileSystem.getInfoAsync(result.uri, { size: true });
      sizeKB = (info.size || 0) / 1024;

      if (sizeKB > maxKBNum) {
        hi = quality;
      } else {
        lo = quality;
      }

      // Close enough — stop early
      if (Math.abs(sizeKB - maxKBNum) < 1.5) break;
    }

    return { uri: result.uri, sizeKB };
  }, []);

  // ── Main processing function ──────────────────────────────────────────────
  const processImages = useCallback(async () => {
    const tw = parseInt(targetW, 10) || 600;
    const th = parseInt(targetH, 10) || 800;
    const maxKB = parseFloat(targetKB) || 23;

    if (mode === 'grid' && !gridImageUri) {
      Alert.alert('No Image', 'Please select a grid image first.');
      return;
    }
    if (mode === 'multiple' && multipleImages.length === 0) {
      Alert.alert('No Images', 'Please select images to process.');
      return;
    }

    setProcessing(true);
    setProcessedFiles([]);
    setProcessingTime(null);
    const startTime = Date.now();

    try {
      const results = [];

      if (mode === 'grid') {
        const imgW = gridImageSize.width;
        const imgH = gridImageSize.height;
        const rows = parseInt(gridRows, 10) || 1;
        const cols = parseInt(gridCols, 10) || 1;
        const tM = marginTop;
        const bM = marginBottom;
        const lM = marginLeft;
        const rM = marginRight;
        const rS = rowSpacing;
        const cS = colSpacing;

        const activeW = imgW - lM - rM;
        const activeH = imgH - tM - bM;
        const cellW = Math.floor((activeW - (cols - 1) * cS) / cols);
        const cellH = Math.floor((activeH - (rows - 1) * rS) / rows);

        if (cellW <= 0 || cellH <= 0) {
          Alert.alert(
            'Invalid Grid',
            'Cell dimensions are zero or negative. Please adjust margins or grid settings.',
          );
          return;
        }

        let count = 1;
        // RTL traversal — right column first
        for (let r = 0; r < rows; r++) {
          for (let c = cols - 1; c >= 0; c--) {
            const x = lM + c * (cellW + cS);
            const y = tM + r * (cellH + rS);

            try {
              // Step 1: crop the cell from the source grid image
              const cropped = await ImageManipulator.manipulateAsync(
                gridImageUri,
                [
                  { crop: { originX: x, originY: y, width: cellW, height: cellH } },
                  { resize: { width: tw, height: th } },
                ],
                { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
              );

              // Step 2: compress to target KB
              const { uri: finalUri, sizeKB } = await compressToTargetKB(
                cropped.uri,
                maxKB,
                tw,
                th,
              );

              results.push({
                uri: finalUri,
                defaultName: `image_${count}`,
                customName: '',
                sizeText: sizeKB.toFixed(1) + ' KB',
              });
              count++;
            } catch (cellErr) {
              // Non-fatal: skip this cell and continue
              console.warn(`Cell r${r}c${c} failed:`, cellErr.message);
              results.push({
                uri: null,
                defaultName: `image_${count}_FAILED`,
                customName: '',
                sizeText: 'Error',
              });
              count++;
            }
          }
        }
      } else {
        // ── Multiple mode ───────────────────────────────────────────────────
        for (let i = 0; i < multipleImages.length; i++) {
          const img = multipleImages[i];
          try {
            const manipResult = await ImageManipulator.manipulateAsync(
              img.uri,
              [{ resize: { width: tw, height: th } }],
              { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
            );

            const { uri: finalUri, sizeKB } = await compressToTargetKB(
              manipResult.uri,
              maxKB,
              tw,
              th,
            );

            const nameBase = img.fileName
              ? img.fileName.replace(/\.[^.]+$/, '')
              : `resized_${i + 1}`;

            results.push({
              uri: finalUri,
              defaultName: nameBase,
              customName: '',
              sizeText: sizeKB.toFixed(1) + ' KB',
            });
          } catch (imgErr) {
            console.warn(`Image ${i + 1} failed:`, imgErr.message);
            results.push({
              uri: null,
              defaultName: `image_${i + 1}_FAILED`,
              customName: '',
              sizeText: 'Error',
            });
          }
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      setProcessedFiles(results);
      setProcessingTime(elapsed);
    } catch (err) {
      Alert.alert(
        'Processing Error',
        err.message || 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setProcessing(false);
    }
  }, [
    mode,
    gridImageUri,
    gridImageSize,
    multipleImages,
    targetW,
    targetH,
    targetKB,
    gridRows,
    gridCols,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    rowSpacing,
    colSpacing,
    compressToTargetKB,
  ]);

  // ── Save to gallery ───────────────────────────────────────────────────────
  const saveAllToGallery = useCallback(async () => {
    const granted = await requestSavePermission();
    if (!granted) return;

    const validFiles = processedFiles.filter((f) => f.uri !== null);
    if (validFiles.length === 0) {
      Alert.alert('Nothing to Save', 'No valid processed images to save.');
      return;
    }

    let saved = 0;
    let failed = 0;

    for (const file of validFiles) {
      try {
        await MediaLibrary.saveToLibraryAsync(file.uri);
        saved++;
      } catch (e) {
        console.warn('Save failed for', file.defaultName, e.message);
        failed++;
      }
    }

    Alert.alert(
      'Download Complete',
      `${saved} image${saved !== 1 ? 's' : ''} saved to your gallery.` +
        (failed > 0 ? `\n${failed} file${failed !== 1 ? 's' : ''} failed to save.` : ''),
    );
  }, [processedFiles]);

  const handleDownloadPress = useCallback(() => {
    if (processedFiles.length === 0) return;
    triggerDownload(saveAllToGallery);
  }, [processedFiles, triggerDownload, saveAllToGallery]);

  // ── Rename handler ────────────────────────────────────────────────────────
  const handleRename = useCallback((index, name) => {
    setProcessedFiles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], customName: name };
      return updated;
    });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      {/* ── Welcome Darood Modal ── */}
      <DaroodModal
        visible={showWelcomeModal}
        title="⚠️ Important Message!"
        subtitle="Please recite Darood Sharif 10 times to open the app."
        daroodText="صلی اللہ علیہ والہ وسلم"
        buttonLabel="👉 Recite Darood & Tap Here 👈"
        countLabel="Count:"
        countTarget={10}
        count={welcomeCount}
        showJazak={showWelcomeJazak}
        onCount={handleWelcomeCount}
        accentColor="#2e7d32"
      />

      {/* ── Download Darood Modal ── */}
      <DaroodModal
        visible={showDownloadModal}
        title="📥 A Good Deed Before Downloading!"
        subtitle="Recite Darood Sharif 2 times to download your images."
        daroodText="صلی اللہ علیہ والہ وسلم"
        buttonLabel="👉 Recite Darood & Tap Here 👈"
        countLabel="Count:"
        countTarget={2}
        count={downloadCount}
        showJazak={showDownloadJazak}
        onCount={handleDownloadCount}
        accentColor="#0288d1"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header Banner ── */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Multi Image Crop &amp; Resizer</Text>
          <Text style={[styles.bannerUrdu, { fontFamily: URDU_FONT }]}>
            ملٹی امیج کراپ اینڈ ریسائزر
          </Text>
        </View>

        {/* ── Credits ── */}
        <View style={styles.creditsBox}>
          <Text style={[styles.creditsUrdu, { fontFamily: URDU_FONT }]}>
            ڈیویلپر: غلام شبیر پرنسپل گورنمنٹ ہائر سیکنڈری سکول وریام والا
          </Text>
          <Text style={styles.creditsEn}>Developed by Ghulam Shabbir</Text>
        </View>

        {/* ── Instructions ── */}
        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>How to Use:</Text>
          <Text style={styles.instructionText}>
            {'• '}
            <Text style={{ fontWeight: '700' }}>Grid Mode:</Text>
            {
              ' Upload a scanned grid sheet. Set rows, columns, and margins to auto-crop each cell into individual images.\n'
            }
            {'• '}
            <Text style={{ fontWeight: '700' }}>Multiple Images Mode:</Text>
            {
              ' Select one or more images from your gallery to resize them all at once to your target dimensions.'
            }
          </Text>
        </View>

        {/* ── Target Size Inputs ── */}
        <Text style={styles.sectionLabel}>Target Dimensions &amp; Quality</Text>
        <View style={styles.dimGrid}>
          <View style={styles.dimCell}>
            <Text style={styles.dimLabel}>Width (px)</Text>
            <TextInput
              style={styles.dimInput}
              keyboardType="numeric"
              value={targetW}
              onChangeText={setTargetW}
              maxLength={5}
            />
          </View>
          <View style={styles.dimCell}>
            <Text style={styles.dimLabel}>Height (px)</Text>
            <TextInput
              style={styles.dimInput}
              keyboardType="numeric"
              value={targetH}
              onChangeText={setTargetH}
              maxLength={5}
            />
          </View>
          <View style={styles.dimCell}>
            <Text style={styles.dimLabel}>Size (KB)</Text>
            <TextInput
              style={styles.dimInput}
              keyboardType="numeric"
              value={targetKB}
              onChangeText={setTargetKB}
              maxLength={4}
            />
          </View>
        </View>

        {/* ── Mode Selector ── */}
        <Text style={styles.sectionLabel}>Select Mode</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'grid' && styles.modeBtnActive]}
            onPress={() => {
              setMode('grid');
              setProcessedFiles([]);
              setProcessingTime(null);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeBtnText,
                mode === 'grid' && styles.modeBtnTextActive,
              ]}
            >
              🗄️ Grid Page
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              mode === 'multiple' && styles.modeBtnActive,
            ]}
            onPress={() => {
              setMode('multiple');
              setProcessedFiles([]);
              setProcessingTime(null);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeBtnText,
                mode === 'multiple' && styles.modeBtnTextActive,
              ]}
            >
              🖼️ Multiple Images
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Grid Mode Controls ── */}
        {mode === 'grid' && (
          <View>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={pickGridImage}
              activeOpacity={0.8}
            >
              <Text style={styles.pickBtnText}>
                {gridImageUri
                  ? '✅ Grid Image Selected — Tap to Change'
                  : '📂 Select Grid Image'}
              </Text>
            </TouchableOpacity>

            {gridImageUri && (
              <View>
                <GridPreview
                  imageUri={gridImageUri}
                  imageWidth={gridImageSize.width}
                  imageHeight={gridImageSize.height}
                  rows={parseInt(gridRows, 10) || 1}
                  cols={parseInt(gridCols, 10) || 1}
                  marginTop={marginTop}
                  marginBottom={marginBottom}
                  marginLeft={marginLeft}
                  marginRight={marginRight}
                  rowSpacing={rowSpacing}
                  colSpacing={colSpacing}
                />

                <Text style={styles.sectionLabel}>Grid Configuration</Text>
                <View style={styles.gridConfigRow}>
                  <View style={styles.gridConfigCell}>
                    <Text style={styles.dimLabel}>Rows</Text>
                    <TextInput
                      style={styles.dimInput}
                      keyboardType="numeric"
                      value={gridRows}
                      onChangeText={setGridRows}
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.gridConfigCell}>
                    <Text style={styles.dimLabel}>Columns</Text>
                    <TextInput
                      style={styles.dimInput}
                      keyboardType="numeric"
                      value={gridCols}
                      onChangeText={setGridCols}
                      maxLength={2}
                    />
                  </View>
                </View>

                <Text style={styles.sectionLabel}>Margins &amp; Spacing</Text>
                <SliderRow
                  label="Top Margin"
                  value={marginTop}
                  min={0}
                  max={Math.floor(gridImageSize.height * 0.4)}
                  onChange={setMarginTop}
                />
                <SliderRow
                  label="Bottom Margin"
                  value={marginBottom}
                  min={0}
                  max={Math.floor(gridImageSize.height * 0.4)}
                  onChange={setMarginBottom}
                />
                <SliderRow
                  label="Left Margin"
                  value={marginLeft}
                  min={0}
                  max={Math.floor(gridImageSize.width * 0.4)}
                  onChange={setMarginLeft}
                />
                <SliderRow
                  label="Right Margin"
                  value={marginRight}
                  min={0}
                  max={Math.floor(gridImageSize.width * 0.4)}
                  onChange={setMarginRight}
                />
                <SliderRow
                  label="Row Spacing"
                  value={rowSpacing}
                  min={-50}
                  max={100}
                  onChange={setRowSpacing}
                  accentColor="#0277bd"
                />
                <SliderRow
                  label="Column Spacing"
                  value={colSpacing}
                  min={-50}
                  max={100}
                  onChange={setColSpacing}
                  accentColor="#0277bd"
                />
              </View>
            )}
          </View>
        )}

        {/* ── Multiple Mode Controls ── */}
        {mode === 'multiple' && (
          <View>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={pickMultipleImages}
              activeOpacity={0.8}
            >
              <Text style={styles.pickBtnText}>
                {multipleImages.length > 0
                  ? `✅ ${multipleImages.length} Image${
                      multipleImages.length !== 1 ? 's' : ''
                    } Selected — Tap to Change`
                  : '📂 Select Images'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Process Button ── */}
        <TouchableOpacity
          style={[styles.processBtn, processing && styles.processBtnDisabled]}
          onPress={processImages}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.processBtnText}>✂️ Crop &amp; Resize</Text>
          )}
        </TouchableOpacity>

        {/* ── Processing Time Badge ── */}
        {processingTime !== null && !processing && (
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>
              ✅ Images processed in {processingTime}s — Rename and download
              below ↓
            </Text>
          </View>
        )}

        {/* ── Results Grid ── */}
        {processedFiles.length > 0 && (
          <ImageResultGrid files={processedFiles} onRename={handleRename} />
        )}

        {/* ── Download Button ── */}
        {processedFiles.length > 0 && (
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={handleDownloadPress}
            activeOpacity={0.85}
          >
            <Text style={styles.downloadBtnText}>
              🚀 Save All Images to Gallery ({processedFiles.length})
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f4f9' },
  scrollContent: { padding: 12 },

  // Banner
  banner: {
    backgroundColor: '#006064',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bannerUrdu: {
    color: '#b2ebf2',
    fontSize: 13,
    marginTop: 2,
    writingDirection: 'rtl',
  },

  // Credits
  creditsBox: {
    backgroundColor: '#ffcc80',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffa000',
  },
  creditsUrdu: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  creditsEn: { fontSize: 10, color: '#555', fontStyle: 'italic' },

  // Instructions
  instructionBox: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  instructionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b5e20',
    marginBottom: 4,
  },
  instructionText: { fontSize: 11, color: '#2e7d32', lineHeight: 18 },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 6,
    marginTop: 4,
  },

  // Dimensions grid
  dimGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  dimCell: { flex: 1, alignItems: 'center' },
  dimLabel: { fontSize: 10, fontWeight: '600', color: '#555', marginBottom: 4 },
  dimInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 6,
    width: '100%',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#fff',
  },

  // Mode selector
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#90caf9',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modeBtnActive: { backgroundColor: '#0288d1', borderColor: '#0288d1' },
  modeBtnText: { fontSize: 12, fontWeight: '600', color: '#0288d1' },
  modeBtnTextActive: { color: '#fff' },

  // Pick button
  pickBtn: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1.5,
    borderColor: '#42a5f5',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  pickBtnText: { fontSize: 12, fontWeight: '600', color: '#0277bd' },

  // Grid config
  gridConfigRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  gridConfigCell: { flex: 1, alignItems: 'center' },

  // Process button
  processBtn: {
    backgroundColor: '#0288d1',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#01579b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  processBtnDisabled: { backgroundColor: '#90caf9' },
  processBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Time badge
  timeBadge: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#a5d6a7',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  timeBadgeText: {
    color: '#1b5e20',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Download button
  downloadBtn: {
    backgroundColor: '#008cba',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 14,
    elevation: 4,
    shadowColor: '#005f7b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  downloadBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
