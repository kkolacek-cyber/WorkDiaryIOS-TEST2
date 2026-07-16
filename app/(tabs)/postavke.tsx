import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../src/components/GlassCard';
import { exportCsv } from '../../src/csv';
import { formatNumber, parseNumber } from '../../src/format';
import { useSettings } from '../../src/SettingsContext';
import { Colors, Radius, Spacing, white } from '../../src/theme';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const [rateText, setRateText] = useState<string | null>(null);
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
    } catch (e) {
      Alert.alert('Greška', 'Izvoz nije uspio. Pokušaj ponovno.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 120 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Postavke</Text>

      {/* Satnica */}
      <GlassCard style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Satnica (€/h)</Text>
          <Text style={styles.caption}>Za automatski izračun zarade iz upisanih sati rada</Text>
          <TextInput
            value={displayedRate}
            onChangeText={(text) => {
              if (text === '' || /^\d{0,4}([.,]\d{0,2})?$/.test(text)) {
                setRateText(text);
                update({ hourlyRate: parseNumber(text) ?? 0 });
              }
            }}
            onBlur={() => setRateText(null)}
            placeholder="npr. 10"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>
      </GlassCard>

      {/* Vrijeme podsjetnika */}
      <GlassCard style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vrijeme podsjetnika</Text>
          <Text style={styles.caption}>Notifikacije stižu u odabrani sat</Text>
          <View style={styles.hourRow}>
            <Pressable onPress={() => shiftHour(-1)} hitSlop={12} style={styles.hourBtn}>
              <Ionicons name="remove" size={22} color={Colors.accent} />
            </Pressable>
            <Text style={styles.hourText}>
              {String(settings.notificationHour).padStart(2, '0')}:00
            </Text>
            <Pressable onPress={() => shiftHour(1)} hitSlop={12} style={styles.hourBtn}>
              <Ionicons name="add" size={22} color={Colors.accent} />
            </Pressable>
          </View>
        </View>
      </GlassCard>

      {/* Notifikacije */}
      <GlassCard style={styles.card}>
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

      {/* Izvoz */}
      <GlassCard style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Izvoz podataka</Text>
          <Text style={styles.caption}>Svi zapisi u CSV (Excel, Numbers, Sheets)</Text>
          <Pressable
            onPress={onExport}
            disabled={exporting}
            style={({ pressed }) => [styles.button, { opacity: pressed || exporting ? 0.7 : 1 }]}
          >
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>{exporting ? 'Izvozim…' : 'Izvezi CSV'}</Text>
          </Pressable>
        </View>
      </GlassCard>

      <Text style={styles.version}>Radni Dnevnik 1.0.0</Text>
    </ScrollView>
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
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.caption}>{subtitle}</Text>
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
  title: { fontSize: 30, fontWeight: '800', color: Colors.textPrimary, marginVertical: Spacing.sm },
  card: { width: '100%' },
  section: { padding: Spacing.xl, gap: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  caption: { fontSize: 13, color: Colors.textSecondary },
  input: {
    marginTop: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: white(0.2),
    borderRadius: Radius.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  hourRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, marginTop: Spacing.sm },
  hourBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: white(0.08),
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourText: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, minWidth: 90, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: white(0.12) },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
    backgroundColor: Colors.accentDeep,
    borderRadius: Radius.field,
    paddingVertical: 14,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', color: Colors.textSecondary, fontSize: 12, marginTop: Spacing.sm },
});
