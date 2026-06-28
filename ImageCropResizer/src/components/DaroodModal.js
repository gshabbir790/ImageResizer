import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export default function DaroodModal({
  visible,
  title,
  subtitle,
  daroodText,
  buttonLabel,
  countLabel,
  countTarget,
  count,
  showJazak,
  onCount,
  accentColor = '#2e7d32',
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const popAnim = useRef(new Animated.Value(0)).current;
  const btnBounce = useRef(new Animated.Value(0)).current;

  // Darood text blink
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.15, duration: 500, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  // Title pulse
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  // Button bounce
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(btnBounce, { toValue: -6, duration: 600, useNativeDriver: true }),
        Animated.timing(btnBounce, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  // Jazakallah pop-in
  useEffect(() => {
    if (showJazak) {
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 5,
        tension: 200,
        useNativeDriver: true,
      }).start();
    } else {
      popAnim.setValue(0);
    }
  }, [showJazak]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { borderColor: accentColor }]}>
          {!showJazak ? (
            <>
              {/* Title */}
              <Animated.Text
                style={[styles.title, { color: '#d32f2f', transform: [{ scale: pulseAnim }] }]}
              >
                {title}
              </Animated.Text>

              {/* Subtitle */}
              <Text style={styles.subtitle}>{subtitle}</Text>

              {/* Darood text (Urdu) */}
              <Animated.Text
                style={[
                  styles.daroodText,
                  { color: accentColor, opacity: blinkAnim },
                ]}
              >
                {daroodText}
              </Animated.Text>

              {/* Counter */}
              <View style={[styles.counterBadge, { borderColor: accentColor, backgroundColor: accentColor + '18' }]}>
                <Text style={[styles.counterText, { color: accentColor }]}>
                  {countLabel} {count} / {countTarget}
                </Text>
              </View>

              {/* CTA Button */}
              <Animated.View style={{ transform: [{ translateY: btnBounce }], width: '100%' }}>
                <TouchableOpacity
                  style={[styles.ctaBtn, { backgroundColor: accentColor, shadowColor: accentColor }]}
                  onPress={onCount}
                  activeOpacity={0.85}
                >
                  <Text style={styles.ctaBtnText}>{buttonLabel}</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            /* Jazakallah message */
            <Animated.Text
              style={[
                styles.jazakText,
                {
                  color: accentColor,
                  transform: [{ scale: popAnim }],
                  opacity: popAnim,
                },
              ]}
            >
              ✨ جزاک اللہ خیر ✨
            </Animated.Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 3,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  daroodText: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 14,
    fontFamily: Platform.select({ android: 'serif', ios: 'GeezaPro' }),
    writingDirection: 'rtl',
  },
  counterBadge: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ctaBtn: {
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    width: '100%',
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  jazakText: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: Platform.select({ android: 'serif', ios: 'GeezaPro' }),
    writingDirection: 'rtl',
  },
});
