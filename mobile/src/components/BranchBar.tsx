import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { findBranch } from '@/lib/catalog';
import { distanceKm, formatDistance } from '@/lib/distance';
import { useCatalog } from '@/state/CatalogContext';
import { useCart } from '@/state/CartContext';
import { useLocation } from '@/state/LocationContext';
import { font, radius, spacing, useColors } from '@/theme';

/** "Ordering from …" row at the top of the menu; opens the branch picker. */
export function BranchBar() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useCart();
  const { status, coords } = useLocation();
  const { catalog } = useCatalog();
  const branch = findBranch(state.branchId, catalog);

  let subtitle = 'Tap to choose a branch';
  if (branch) {
    subtitle = coords ? `${formatDistance(distanceKm(coords, branch))} away · ${branch.hours}` : branch.hours;
  } else if (status === 'denied') {
    subtitle = 'Location is off — choose a branch manually';
  }

  return (
    <Pressable
      onPress={() => router.push('/branch')}
      accessibilityRole="button"
      accessibilityHint="Opens the branch picker"
      style={({ pressed }) => [
        styles.bar,
        {
          backgroundColor: branch ? colors.surface : colors.accentSoft,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.text}>
        <Text style={[font.caption, { color: colors.textMuted }]}>Ordering from</Text>
        <Text style={[font.heading, { color: colors.text }]}>
          {branch ? branch.name : status === 'locating' ? 'Finding nearest branch…' : 'No branch selected'}
        </Text>
        <Text style={[font.caption, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      {status === 'locating' ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <Text style={[font.body, { color: colors.accent, fontWeight: '600' }]}>Change</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: 2 },
});
