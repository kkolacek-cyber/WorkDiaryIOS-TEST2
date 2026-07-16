import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { AppBackground } from '../../src/components/AppBackground';
import { GlassCard } from '../../src/components/GlassCard';
import { exportCsv } from '../../src/csv';
import { formatNumber, parseNumber } from '../../src/format';
import { useSettings } from '../../src/SettingsContext';
import { Colors, glowShadow, Radius, Spacing, Type, white } from '../../src/theme';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const [rateText, setRateText] = useState<string | null>(null);
  const [rateFocused, setRateFocused] = useState(false);
  const [exporting, setExporting] = useState(false);

  const displayedRate =
    rateText ?? (settings.hourlyRate > 0 ? formatNumber(settings.hourlyRate) : '');

  const shiftHour = (delta: number) => {
    Haptics.selectionAsync();
    update({ notificationHour: (settings.notificationHour + delta + 24) % 24 });
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const ok = await exportCsv(db);
      if (!ok) Alert.alert('Nema podataka', 'Još nema nijednog zapisa za izvoz.');
    } catch {
      Alert.alert('Greška', 'Izvoz nije uspio. Pokušaj ponovno.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 130 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.springify().damping(18)}>
          <Text style={styles.title}>Postavke</Text>
        </Animated.View>

        {/* Satnica */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(18)}>
          <GlassCard>
            <View style={styles.section}>
              <Text style={Type.eyebrow}>Satnica (€/h)</Text>
              <Text style={Type.body}>Za automatski izračun zarade iz upisanih sati rada</Text>
              <TextInput
                value={displayedRate}
                onChangeText={(text) => {
                  if (text === '' || /^\d{0,4}([.,]\d{0,2})?$/.test(text)) {
                    setRateText(text);
                    update({ hourlyRate: parseNumber(text) ?? 0 });
                  }
                }}
                onFocus={() => setRateFocused(true)}
                onBlur={() => {
                  setRateFocused(false);
                  setRateText(null);
                }}
                placeholder="npr. 10"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, rateFocused && styles.inputFocused]}
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Vrijeme podsjetnika */}
        <Animated.View entering={FadeInDown.delay(110).springify().damping(18)}>
          <GlassCard>
            <View style={styles.section}>
              <Text style={Type.eyebrow}>Vrijeme podsjetnika</Text>
              <Text style={Type.body}>Notifikacije stižu u odabrani sat</Text>
              <View style={styles.hourRow}>
                <AnimatedPressable pressScale={0.85} onPress={() => shiftHour(-1)} style={styles.hourBtn}>
                  <Ionicons name="remove" size={22} color={Colors.accent} />
                </AnimatedPressable>
                <Text style={styles.hourText}>
                  {String(settings.notificationHour).padStart(2, '0')}:00
                </Text>
                <AnimatedPressable pressScale={0.85} onPress={() => shiftHour(1)} style={styles.hourBtn}>
                  <Ionicons name="add" size={22} color={Colors.accent} />
                </AnimatedPressable>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Notifikacije */}
        <Animated.View entering={FadeInDown.delay(160).springify().damping(18)}>
          <GlassCard>
            <View style={[styles.section, { gap: 0 }]}>
              <Row
                title="Neplaćeni rad"
                subtitle="Podsjeti 7 dana nakon rada ako još nije isplaćeno"
                value={settings.unpaidNotifEnabled}
                onChange={(v) => update({ unpaidNotifEnabled: v })}
              />
              <View style={styles.divider} />
              <Row
                title="Neupisani dani"
                subtitle="Podsjeti ako jučerašnji dan nije upisan"
                value={settings.missingNotifEnabled}
                onChange={(v) => update({ missingNotifEnabled: v })}
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Izvoz */}
        <Animated.View entering={FadeInDown.delay(210).springify().damping(18)}>
          <GlassCard>
            <View style={styles.section}>
              <Text style={Type.eyebrow}>Izvoz podataka</Text>
              <Text style={Type.body}>Svi zapisi u CSV (Excel, Numbers, Sheets)</Text>
              <AnimatedPressable
                pressScale={0.97}
                onPress={onExport}
                disabled={exporting}
                style={glowShadow}
              >
                <LinearGradient
                  colors={[Colors.accent, Colors.accentDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.button, exporting && { opacity: 0.6 }]}
                >
                  <Ionicons name="share-outline" size={18} color="#fff" />
                  <Text style={styles.buttonText}>{exporting ? 'Izvozim…' : 'Izvezi CSV'}</Text>
                </LinearGradient>
              </AnimatedPressable>
            </View>
          </GlassCard>
        </Animated.View>

        <Text style={styles.version}>Radni Dnevnik 1.0.0</Text>
      </ScrollView>
    </AppBackground>
  );
}

function Row({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: Spacing.md }}>
        <Text style={Type.title}>{title}</Text>
        <Text style={[Type.body, { fontSize: 13, marginTop: 2 }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.selectionAsync();
          onChange(v);
        }}
        trackColor={{ true: Colors.accentDeep, false: white(0.15) }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  title: { ...Type.hero, marginVertical: Spacing.sm },
  section: { padding: Spacing.xl, gap: Spacing.sm },

  input: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: white(0.16),
    borderRadius: Radius.field,
    backgroundColor: white(0.04),
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: Colors.accent,
    backgroundColor: white(0.06),
  },

  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.sm,
  },
  hourBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: white(0.07),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: white(0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.textPrimary,
    minWidth: 96,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: white(0.12) },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
    borderRadius: Radius.field,
    paddingVertical: 15,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  version: { textAlign: 'center', color: Colors.textSecondary, fontSize: 12, marginTop: Spacing.sm },
});
