import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { AppBackground } from '../../src/components/AppBackground';
import { GlassCard } from '../../src/components/GlassCard';
import { MiniBarChart } from '../../src/components/MiniBarChart';
import { getFilledRange, getMonthlyTotals, type MonthTotal } from '../../src/db/entries';
import { formatCurrency, formatMonthYear, formatNumber, toIso, todayIso } from '../../src/format';
import { accentA, Colors, Radius, Spacing, Type, white } from '../../src/theme';
import { statusOf, type DayStatus, type WorkEntry } from '../../src/types';

const WEEKDAYS = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

export default function CalendarScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());
  const [direction, setDirection] = useState(0); // -1 unazad, 1 unaprijed
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [entries, setEntries] = useState<Map<string, WorkEntry>>(new Map());
  const [monthly, setMonthly] = useState<MonthTotal[]>([]);

  const load = useCallback(async () => {
    const start = toIso(new Date(year, month0, 1));
    const end = toIso(new Date(year, month0 + 1, 0));
    const range = await getFilledRange(db, start, end);
    setEntries(new Map(range.map((e) => [e.date, e])));
    setMonthly(await getMonthlyTotals(db, 6));
  }, [db, year, month0]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const stats = useMemo(() => {
    const worked = [...entries.values()].filter((e) => e.worked);
    return {
      total: worked.reduce((s, e) => s + (e.earnings ?? 0), 0),
      unpaid: worked.filter((e) => !e.isPaid).reduce((s, e) => s + (e.earnings ?? 0), 0),
      workedDays: worked.length,
      hours: worked.reduce((s, e) => s + (e.hours ?? 0), 0),
      usluzno: worked.filter((e) => e.workType === 'USLUZNO').length,
      obiteljski: worked.filter((e) => e.workType === 'OBITELJSKI').length,
    };
  }, [entries]);

  const cells = useMemo(() => {
    const first = new Date(year, month0, 1);
    const leading = (first.getDay() + 6) % 7; // ponedjeljak = 0
    const daysInMonth = new Date(year, month0 + 1, 0).getDate();
    const out: (string | null)[] = Array(leading).fill(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(toIso(new Date(year, month0, d)));
    return out;
  }, [year, month0]);

  const shift = (delta: number) => {
    Haptics.selectionAsync();
    setDirection(delta);
    const d = new Date(year, month0 + delta, 1);
    setYear(d.getFullYear());
    setMonth0(d.getMonth());
  };

  const monthEnter = direction >= 0
    ? FadeInRight.springify().damping(20)
    : FadeInLeft.springify().damping(20);

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 130 },
        ]}
      >
        <View style={styles.header}>
          <AnimatedPressable pressScale={0.85} onPress={() => shift(-1)} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </AnimatedPressable>

          <Animated.Text key={`t-${year}-${month0}`} entering={monthEnter} style={styles.monthTitle}>
            {formatMonthYear(year, month0)}
          </Animated.Text>

          <AnimatedPressable pressScale={0.85} onPress={() => shift(1)} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={22} color={Colors.textPrimary} />
          </AnimatedPressable>
        </View>

        <AnimatedPressable
          pressScale={0.96}
          onPress={() => setOnlyUnpaid((v) => !v)}
          style={[styles.filter, onlyUnpaid && styles.filterActive]}
        >
          <Ionicons
            name={onlyUnpaid ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={onlyUnpaid ? Colors.accent : Colors.textSecondary}
          />
          <Text style={[styles.filterText, onlyUnpaid && { color: Colors.accent }]}>
            Prikaži samo neplaćeno
          </Text>
        </AnimatedPressable>

        <GlassCard tint={0.08}>
          <View style={{ padding: Spacing.md }}>
            <View style={styles.weekRow}>
              {WEEKDAYS.map((d) => (
                <Text key={d} style={styles.weekday}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Grid mjeseca kliže s lijeva/desna ovisno o smjeru listanja */}
            <Animated.View key={`g-${year}-${month0}`} entering={monthEnter} style={styles.grid}>
              {cells.map((iso, i) => {
                if (!iso) return <View key={`b${i}`} style={styles.cell} />;
                const entry = entries.get(iso);
                const status = entry ? statusOf(entry) : 'NOT_WORKED';
                const dimmed = onlyUnpaid && status !== 'WAITING';
                const isToday = iso === todayIso();
                return (
                  <Pressable
                    key={iso}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(`/dan/${iso}`);
                    }}
                    style={styles.cell}
                  >
                    <View style={[styles.cellInner, isToday && styles.today]}>
                      <Text
                        style={[
                          styles.dayNum,
                          dimmed && { color: white(0.18) },
                          !dimmed && status === 'NOT_WORKED' && { color: Colors.textSecondary },
                          isToday && { color: Colors.accent, fontWeight: '800' },
                        ]}
                      >
                        {Number(iso.slice(8, 10))}
                      </Text>
                      <View style={[styles.dot, { backgroundColor: dotColor(status, dimmed) }]} />
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          </View>
        </GlassCard>

        <View style={styles.legend}>
          <LegendItem color={Colors.paid} label="Plaćeno" />
          <LegendItem color={Colors.waiting} label="Čeka isplatu" />
          <LegendItem color={white(0.18)} label="Nije rađeno" />
        </View>

        <Animated.View entering={FadeInDown.delay(80).springify().damping(18)}>
          <GlassCard tint={0.1}>
            <View style={styles.section}>
              <Text style={Type.eyebrow}>Statistika mjeseca</Text>
              <View style={styles.statsRow}>
                <Stat label="Zarada" value={formatCurrency(stats.total)} color={Colors.paid} />
                <Stat label="Neplaćeno" value={formatCurrency(stats.unpaid)} color={Colors.waiting} />
                <Stat label="Radnih dana" value={String(stats.workedDays)} color={Colors.textPrimary} />
              </View>
              <Text style={Type.caption}>
                Ukupno sati: {formatNumber(stats.hours)} · Uslužno: {stats.usluzno} · Obiteljski: {stats.obiteljski}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).springify().damping(18)}>
          <GlassCard tint={0.1}>
            <View style={styles.section}>
              <Text style={Type.eyebrow}>Zarada · zadnjih 6 mjeseci</Text>
              <MiniBarChart data={monthly} />
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </AppBackground>
  );
}

function dotColor(status: DayStatus, dimmed: boolean): string {
  if (dimmed) return 'transparent';
  if (status === 'PAID') return Colors.paid;
  if (status === 'WAITING') return Colors.waiting;
  return 'transparent';
}

const Stat = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <View style={{ flex: 1 }}>
    <Text style={Type.caption}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={Type.caption}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: white(0.07),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: white(0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, color: Colors.textPrimary },

  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: white(0.06),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: white(0.12),
  },
  filterActive: { backgroundColor: accentA(0.14), borderColor: accentA(0.4) },
  filterText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },

  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.sm },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  cellInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: Radius.pill,
  },
  today: {
    backgroundColor: accentA(0.16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: accentA(0.4),
  },
  dayNum: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', fontVariant: ['tabular-nums'] },
  dot: { width: 6, height: 6, borderRadius: 3 },

  legend: { flexDirection: 'row', gap: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  section: { padding: Spacing.lg, gap: Spacing.md },
  statsRow: { flexDirection: 'row' },
  statValue: { fontSize: 15, fontWeight: '800', marginTop: 2, fontVariant: ['tabular-nums'] },
});
