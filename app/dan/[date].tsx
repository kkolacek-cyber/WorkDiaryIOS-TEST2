import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../../src/components/AppBackground';
import { GlassCard } from '../../src/components/GlassCard';
import { WorkTypeChip } from '../../src/components/WorkTypeChip';
import { deleteEntry, getEntry, saveEntry } from '../../src/db/entries';
import {
  formatCurrency,
  formatDayHeader,
  formatFullDate,
  formatNumber,
  parseNumber,
  toDate,
  toIso,
  todayIso,
} from '../../src/format';
import { useSettings } from '../../src/SettingsContext';
import { Colors, Radius, Spacing, white } from '../../src/theme';
import type { WorkType } from '../../src/types';

export default function DetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { settings, refreshNotifications } = useSettings();
  const rate = settings.hourlyRate;

  const [worked, setWorked] = useState(false);
  const [workType, setWorkType] = useState<WorkType | null>(null);
  const [description, setDescription] = useState('');
  const [hoursText, setHoursText] = useState('');
  const [earningsText, setEarningsText] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [paidDate, setPaidDate] = useState<string | null>(null);
  const [existsInDb, setExistsInDb] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const e = await getEntry(db, date);
      if (!e) return;
      setWorked(e.worked);
      setWorkType(e.workType);
      setDescription(e.description);
      setHoursText(e.hours !== null ? formatNumber(e.hours) : '');
      setEarningsText(e.earnings !== null ? formatNumber(e.earnings) : '');
      setIsPaid(e.isPaid);
      setPaidDate(e.paidDate);
      setExistsInDb(true);
    })();
  }, [db, date]);

  /** Upis sati -> zarada se sama izračuna (sati × satnica). */
  const onHoursChange = (text: string) => {
    if (text !== '' && !/^\d{0,3}([.,]\d{0,2})?$/.test(text)) return;
    setHoursText(text);
    const h = parseNumber(text);
    if (rate > 0 && h !== null && h > 0) setEarningsText(formatNumber(h * rate));
  };

  /** Upis zarade -> sati se sami izračunaju (zarada ÷ satnica). */
  const onEarningsChange = (text: string) => {
    if (text !== '' && !/^\d{0,9}([.,]\d{0,2})?$/.test(text)) return;
    setEarningsText(text);
    const amount = parseNumber(text);
    if (rate > 0 && amount !== null && amount > 0) setHoursText(formatNumber(amount / rate));
  };

  const onToggleWorked = (v: boolean) => {
    Haptics.selectionAsync();
    setWorked(v);
    if (!v) {
      setIsPaid(false);
      setPaidDate(null);
    }
  };

  const onTogglePaid = (v: boolean) => {
    Haptics.selectionAsync();
    setIsPaid(v);
    setPaidDate(v ? paidDate ?? todayIso() : null);
  };

  const onSave = useCallback(async () => {
    await saveEntry(db, {
      date,
      worked,
      workType,
      description,
      hours: parseNumber(hoursText),
      earnings: parseNumber(earningsText),
      isPaid,
      paidDate,
      lastModified: Date.now(),
    });
    await refreshNotifications();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [db, date, worked, workType, description, hoursText, earningsText, isPaid, paidDate, refreshNotifications]);

  const onDelete = () => {
    Alert.alert('Obrisati zapis?', `Dan ${formatFullDate(date)} vraća se u prazno stanje.`, [
      { text: 'Odustani', style: 'cancel' },
      {
        text: 'Obriši',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(db, date);
          await refreshNotifications();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  };

  const hours = parseNumber(hoursText);

  return (
    <AppBackground>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-down" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>{formatDayHeader(date)}</Text>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.rowTitle}>{worked ? 'Radilo se' : 'Nije se radilo'}</Text>
            <Switch
              value={worked}
              onValueChange={onToggleWorked}
              trackColor={{ true: Colors.accentDeep, false: white(0.15) }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        {worked && (
          <>
            <GlassCard style={styles.card}>
              <View style={styles.section}>
                <Text style={styles.caption}>Tip posla</Text>
                <WorkTypeChip selected={workType} onSelect={setWorkType} />
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <View style={styles.section}>
                <Text style={styles.caption}>Opis rada</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Što je rađeno…"
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
                />
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <View style={styles.section}>
                <Text style={styles.caption}>Sati rada</Text>
                <TextInput
                  value={hoursText}
                  onChangeText={onHoursChange}
                  placeholder="npr. 8"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <View style={styles.section}>
                <Text style={styles.caption}>Zarada (€)</Text>
                <TextInput
                  value={earningsText}
                  onChangeText={onEarningsChange}
                  placeholder="0,00"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                {rate > 0 && (
                  <Text style={styles.hint}>
                    Satnica {formatCurrency(rate)}/h — sati i zarada se automatski preračunavaju
                    {hours ? ` (${formatNumber(hours)} h × ${formatCurrency(rate)})` : ''}
                  </Text>
                )}
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <View style={styles.section}>
                <View style={styles.switchRowInner}>
                  <Text style={styles.rowTitle}>Isplaćeno</Text>
                  <Switch
                    value={isPaid}
                    onValueChange={onTogglePaid}
                    trackColor={{ true: Colors.paid, false: white(0.15) }}
                    thumbColor="#fff"
                  />
                </View>
                {isPaid && paidDate && (
                  <Pressable onPress={() => setShowPicker(true)}>
                    <Text style={[styles.hint, { color: Colors.paid }]}>
                      Datum isplate: {formatFullDate(paidDate)} · promijeni
                    </Text>
                  </Pressable>
                )}
              </View>
            </GlassCard>
          </>
        )}

        <Pressable onPress={onSave} style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.8 : 1 }]}>
          <Text style={styles.saveText}>Spremi</Text>
        </Pressable>

        {existsInDb && (
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Obriši zapis</Text>
          </Pressable>
        )}
      </ScrollView>

      {showPicker && (
        <DateTimePicker
          value={toDate(paidDate ?? date)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          themeVariant="dark"
          onChange={(_, selected) => {
            setShowPicker(Platform.OS === 'ios');
            if (selected) setPaidDate(toIso(selected));
          }}
        />
      )}
    </KeyboardAvoidingView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: white(0.08),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  card: { width: '100%' },
  section: { padding: Spacing.lg, gap: Spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  switchRowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  caption: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  input: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: white(0.2),
    borderRadius: Radius.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  hint: { fontSize: 12, color: Colors.accent, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.accentDeep,
    borderRadius: Radius.field,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  deleteBtn: { paddingVertical: 14, alignItems: 'center' },
  deleteText: { color: Colors.danger, fontSize: 15, fontWeight: '600' },
});
