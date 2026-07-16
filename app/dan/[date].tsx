import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
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
import { Colors, glowShadow, Radius, Spacing, Type, white } from '../../src/theme';
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
  const inputStyle = (name: string) => [styles.input, focusedField === name && styles.inputFocused];

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
          <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.header}>
            <AnimatedPressable pressScale={0.85} onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-down" size={22} color={Colors.textPrimary} />
            </AnimatedPressable>
            <Text style={styles.title}>{formatDayHeader(date)}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(50).springify().damping(18)} layout={LinearTransition.springify().damping(18)}>
            <GlassCard>
              <View style={styles.switchRow}>
                <Text style={Type.title}>{worked ? 'Radilo se' : 'Nije se radilo'}</Text>
                <Switch
                  value={worked}
                  onValueChange={onToggleWorked}
                  trackColor={{ true: Colors.accentDeep, false: white(0.15) }}
                  thumbColor="#fff"
                />
              </View>
            </GlassCard>
          </Animated.View>

          {worked && (
            <Animated.View
              entering={FadeInDown.springify().damping(17)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.springify().damping(18)}
              style={{ gap: Spacing.md }}
            >
              <GlassCard>
                <View style={styles.section}>
                  <Text style={Type.eyebrow}>Tip posla</Text>
                  <WorkTypeChip selected={workType} onSelect={setWorkType} />
                </View>
              </GlassCard>

              <GlassCard>
                <View style={styles.section}>
                  <Text style={Type.eyebrow}>Opis rada</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    onFocus={() => setFocusedField('desc')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Što je rađeno…"
                    placeholderTextColor={Colors.textSecondary}
                    multiline
                    style={[...inputStyle('desc'), { minHeight: 90, textAlignVertical: 'top' }]}
                  />
                </View>
              </GlassCard>

              <GlassCard>
                <View style={styles.section}>
                  <Text style={Type.eyebrow}>Sati rada</Text>
                  <TextInput
                    value={hoursText}
                    onChangeText={onHoursChange}
                    onFocus={() => setFocusedField('hours')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="npr. 8"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="decimal-pad"
                    style={inputStyle('hours')}
                  />
                </View>
              </GlassCard>

              <GlassCard>
                <View style={styles.section}>
                  <Text style={Type.eyebrow}>Zarada (€)</Text>
                  <TextInput
                    value={earningsText}
                    onChangeText={onEarningsChange}
                    onFocus={() => setFocusedField('earn')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="0,00"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="decimal-pad"
                    style={inputStyle('earn')}
                  />
                  {rate > 0 && (
                    <Animated.View entering={FadeIn}>
                      <Text style={styles.hint}>
                        Satnica {formatCurrency(rate)}/h — sati i zarada se automatski preračunavaju
                        {hours ? ` (${formatNumber(hours)} h × ${formatCurrency(rate)})` : ''}
                      </Text>
                    </Animated.View>
                  )}
                </View>
              </GlassCard>

              <GlassCard>
                <View style={styles.section}>
                  <View style={styles.switchRowInner}>
                    <Text style={Type.title}>Isplaćeno</Text>
                    <Switch
                      value={isPaid}
                      onValueChange={onTogglePaid}
                      trackColor={{ true: Colors.paid, false: white(0.15) }}
                      thumbColor="#fff"
                    />
                  </View>
                  {isPaid && paidDate && (
                    <Animated.View entering={FadeIn}>
                      <AnimatedPressable haptic={false} pressScale={0.98} onPress={() => setShowPicker(true)}>
                        <Text style={[styles.hint, { color: Colors.paid }]}>
                          Datum isplate: {formatFullDate(paidDate)} · promijeni
                        </Text>
                      </AnimatedPressable>
                    </Animated.View>
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          <Animated.View layout={LinearTransition.springify().damping(18)} style={{ gap: Spacing.sm }}>
            <AnimatedPressable pressScale={0.97} onPress={onSave} style={glowShadow}>
              <LinearGradient
                colors={[Colors.accent, Colors.accentDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>Spremi</Text>
              </LinearGradient>
            </AnimatedPressable>

            {existsInDb && (
              <AnimatedPressable pressScale={0.97} onPress={onDelete} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Obriši zapis</Text>
              </AnimatedPressable>
            )}
          </Animated.View>
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
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: white(0.07),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: white(0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: Colors.textPrimary, flex: 1 },

  section: { padding: Spacing.lg, gap: Spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 15,
  },
  switchRowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  input: {
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
  hint: { fontSize: 12, color: Colors.accent, marginTop: 2, fontWeight: '500' },

  saveBtn: {
    borderRadius: Radius.field,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  deleteBtn: { paddingVertical: 13, alignItems: 'center' },
  deleteText: { color: Colors.danger, fontSize: 15, fontWeight: '600' },
});
