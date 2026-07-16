import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../src/components/GlassCard';
import { StatusBadge } from '../../src/components/StatusBadge';
import { getFilledRange, getUnpaidEntries, markPaid } from '../../src/db/entries';
import { addDaysIso, formatCurrency, formatDayHeader, formatNumber, todayIso } from '../../src/format';
import { useSettings } from '../../src/SettingsContext';
import { Colors, Spacing, white } from '../../src/theme';
import { statusOf, WORK_TYPE_LABEL, type DayStatus, type WorkEntry } from '../../src/types';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { refreshNotifications } = useSettings();

  const [days, setDays] = useState<WorkEntry[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const today = todayIso();
    const range = await getFilledRange(db, addDaysIso(today, -6), today);
    setDays(range);
    setWeekTotal(range.reduce((sum, e) => sum + (e.earnings ?? 0), 0));

    // Ukupan dug se računa preko SVIH zapisa, ne samo zadnjih 7 dana —
    // to je broj koji te zapravo zanima.
    const unpaid = await getUnpaidEntries(db);
    setUnpaidCount(unpaid.length);
    setUnpaidTotal(unpaid.reduce((sum, e) => sum + (e.earnings ?? 0), 0));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onQuickPaid = useCallback(
    async (entry: WorkEntry) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await markPaid(db, entry.date, true);
      await load();
      await refreshNotifications();
    },
    [db, load, refreshNotifications],
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 140 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={Colors.accent}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <Text style={styles.title}>Radni Dnevnik</Text>

        <SummaryCard weekTotal={weekTotal} unpaidTotal={unpaidTotal} unpaidCount={unpaidCount} />

        {days.map((entry) => (
          <DayCard
            key={entry.date}
            entry={entry}
            onPress={() => router.push(`/dan/${entry.date}`)}
            onQuickPaid={() => onQuickPaid(entry)}
          />
        ))}
      </ScrollView>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/dan/${todayIso()}`);
        }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 96, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </>
  );
}

function SummaryCard({
  weekTotal,
  unpaidTotal,
  unpaidCount,
}: {
  weekTotal: number;
  unpaidTotal: number;
  unpaidCount: number;
}) {
  return (
    <GlassCard style={styles.card} tint={0.14}>
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.caption}>Zarada (7 dana)</Text>
          <Text style={[styles.bigNumber, { color: Colors.paid }]}>{formatCurrency(weekTotal)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.caption}>Duguju ti</Text>
          <Text style={[styles.bigNumber, { color: unpaidTotal > 0 ? Colors.waiting : Colors.textPrimary }]}>
            {formatCurrency(unpaidTotal)}
          </Text>
          <Text style={styles.caption}>
            {unpaidCount} {unpaidCount === 1 ? 'dan' : 'dana'} čeka isplatu
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

const ICON: Record<DayStatus, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  PAID: { name: 'checkmark-circle', color: Colors.paid },
  WAITING: { name: 'time', color: Colors.waiting },
  NOT_WORKED: { name: 'remove-circle-outline', color: Colors.neutral },
};

function DayCard({
  entry,
  onPress,
  onQuickPaid,
}: {
  entry: WorkEntry;
  onPress: () => void;
  onQuickPaid: () => void;
}) {
  const status = statusOf(entry);
  const icon = ICON[status];

  return (
    <GlassCard
      style={styles.card}
      tint={status === 'NOT_WORKED' ? 0.05 : 0.1}
      onPress={onPress}
      onLongPress={status === 'WAITING' ? onQuickPaid : undefined}
    >
      <View style={styles.dayRow}>
        <Ionicons name={icon.name} size={28} color={icon.color} />

        <View style={styles.dayMiddle}>
          <Text
            style={[
              styles.dayTitle,
              { color: status === 'NOT_WORKED' ? Colors.textSecondary : Colors.textPrimary },
            ]}
          >
            {formatDayHeader(entry.date)}
          </Text>
          {entry.worked ? (
            <>
              {!!entry.description && (
                <Text style={styles.daySub} numberOfLines={1}>
                  {entry.description}
                </Text>
              )}
              {!!entry.workType && (
                <Text style={styles.typeLabel}>{WORK_TYPE_LABEL[entry.workType]}</Text>
              )}
            </>
          ) : (
            <Text style={[styles.daySub, { color: Colors.neutral }]}>Nije rađeno</Text>
          )}
        </View>

        <View style={styles.dayRight}>
          {entry.earnings !== null && (
            <Text style={styles.amount}>{formatCurrency(entry.earnings)}</Text>
          )}
          {entry.hours !== null && <Text style={styles.hours}>{formatNumber(entry.hours)} h</Text>}
          {status !== 'NOT_WORKED' && <StatusBadge status={status} />}
        </View>
      </View>

      {status === 'WAITING' && (
        <Pressable onPress={onQuickPaid} style={styles.quickPaid}>
          <Ionicons name="cash-outline" size={15} color={Colors.paid} />
          <Text style={styles.quickPaidText}>Označi kao isplaćeno</Text>
        </Pressable>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 30, fontWeight: '800', color: Colors.textPrimary, marginVertical: Spacing.sm },
  card: { width: '100%' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.xl,
  },
  caption: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  bigNumber: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  dayRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
  dayMiddle: { flex: 1, paddingHorizontal: 14 },
  dayTitle: { fontSize: 16, fontWeight: '700' },
  daySub: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  typeLabel: { fontSize: 12, color: Colors.accent, fontWeight: '600', marginTop: 4 },
  dayRight: { alignItems: 'flex-end', gap: 3 },
  amount: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  hours: { fontSize: 12, color: Colors.textSecondary },
  quickPaid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: white(0.12),
  },
  quickPaidText: { color: Colors.paid, fontSize: 13, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
