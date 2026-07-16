import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { AppBackground } from '../../src/components/AppBackground';
import { CountUp } from '../../src/components/CountUp';
import { GlassCard } from '../../src/components/GlassCard';
import { StatusBadge } from '../../src/components/StatusBadge';
import { getFilledRange, getUnpaidEntries, markPaid } from '../../src/db/entries';
import { addDaysIso, formatCurrency, formatDayHeader, formatNumber, todayIso } from '../../src/format';
import { useSettings } from '../../src/SettingsContext';
import { Colors, glowShadow, Spacing, Type, white } from '../../src/theme';
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
    <AppBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 150 },
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
        <Animated.View entering={FadeInDown.springify().damping(18)}>
          <Text style={styles.title}>Radni Dnevnik</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).springify().damping(18)}>
          <HeroCard weekTotal={weekTotal} unpaidTotal={unpaidTotal} unpaidCount={unpaidCount} />
        </Animated.View>

        {days.map((entry, i) => (
          <Animated.View
            key={entry.date}
            entering={FadeInDown.delay(120 + i * 55).springify().damping(18)}
          >
            <DayCard
              entry={entry}
              onPress={() => router.push(`/dan/${entry.date}`)}
              onQuickPaid={() => onQuickPaid(entry)}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <AnimatedPressable
        pressScale={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/dan/${todayIso()}`);
        }}
        style={[styles.fabWrap, { bottom: insets.bottom + 104 }]}
      >
        <LinearGradient
          colors={[Colors.accent, Colors.accentDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </AnimatedPressable>
    </AppBackground>
  );
}

function HeroCard({
  weekTotal,
  unpaidTotal,
  unpaidCount,
}: {
  weekTotal: number;
  unpaidTotal: number;
  unpaidCount: number;
}) {
  return (
    <GlassCard tint={0.13}>
      <View style={styles.hero}>
        <Text style={Type.eyebrow}>Zarada · zadnjih 7 dana</Text>
        <CountUp
          value={weekTotal}
          format={formatCurrency}
          style={[Type.bigNumber, { color: Colors.paid, marginTop: 4 }]}
        />

        <View style={styles.heroDivider} />

        <View style={styles.heroRow}>
          <View>
            <Text style={Type.eyebrow}>Duguju ti</Text>
            <CountUp
              value={unpaidTotal}
              format={formatCurrency}
              style={[
                Type.bigNumber,
                { fontSize: 22, marginTop: 2, color: unpaidTotal > 0 ? Colors.waiting : Colors.textPrimary },
              ]}
            />
          </View>
          <View style={styles.heroCountPill}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={Type.caption}>
              {unpaidCount} {unpaidCount === 1 ? 'dan čeka' : 'dana čeka'}
            </Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

const ICON: Record<DayStatus, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  PAID: { name: 'checkmark', color: Colors.paid },
  WAITING: { name: 'hourglass-outline', color: Colors.waiting },
  NOT_WORKED: { name: 'moon-outline', color: Colors.neutral },
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
      tint={status === 'NOT_WORKED' ? 0.045 : 0.1}
      onPress={onPress}
      onLongPress={status === 'WAITING' ? onQuickPaid : undefined}
    >
      <View style={styles.dayRow}>
        {/* Glass ikonica statusa */}
        <View style={[styles.iconChip, { backgroundColor: `${icon.color}1E`, borderColor: `${icon.color}44` }]}>
          <Ionicons name={icon.name} size={18} color={icon.color} />
        </View>

        <View style={styles.dayMiddle}>
          <Text
            style={[
              Type.title,
              status === 'NOT_WORKED' && { color: Colors.textSecondary, fontWeight: '600' },
            ]}
          >
            {formatDayHeader(entry.date)}
          </Text>
          {entry.worked ? (
            <>
              {!!entry.description && (
                <Text style={[Type.body, { marginTop: 2 }]} numberOfLines={1}>
                  {entry.description}
                </Text>
              )}
              {!!entry.workType && (
                <Text style={styles.typeLabel}>{WORK_TYPE_LABEL[entry.workType]}</Text>
              )}
            </>
          ) : (
            <Text style={[Type.body, { color: Colors.neutral, marginTop: 2 }]}>Slobodan dan</Text>
          )}
        </View>

        <View style={styles.dayRight}>
          {entry.earnings !== null && (
            <Text style={styles.amount}>{formatCurrency(entry.earnings)}</Text>
          )}
          {entry.hours !== null && (
            <Text style={Type.caption}>{formatNumber(entry.hours)} h</Text>
          )}
          {status !== 'NOT_WORKED' && <StatusBadge status={status} />}
        </View>
      </View>

      {status === 'WAITING' && (
        <AnimatedPressable onPress={onQuickPaid} pressScale={0.98} style={styles.quickPaid}>
          <Ionicons name="cash-outline" size={15} color={Colors.paid} />
          <Text style={styles.quickPaidText}>Označi kao isplaćeno</Text>
        </AnimatedPressable>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  title: { ...Type.hero, marginVertical: Spacing.sm },

  hero: { padding: Spacing.xl },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: white(0.14),
    marginVertical: Spacing.lg,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: white(0.06),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: white(0.12),
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  dayRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12 },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayMiddle: { flex: 1 },
  typeLabel: { fontSize: 12, color: Colors.accent, fontWeight: '700', marginTop: 4, letterSpacing: 0.3 },
  dayRight: { alignItems: 'flex-end', gap: 3 },
  amount: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, fontVariant: ['tabular-nums'] },

  quickPaid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: white(0.12),
  },
  quickPaidText: { color: Colors.paid, fontSize: 13, fontWeight: '700' },

  fabWrap: {
    position: 'absolute',
    right: Spacing.xl,
    ...glowShadow,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
