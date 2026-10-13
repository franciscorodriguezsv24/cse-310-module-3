import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { findProduct } from '@/lib/catalog';
import { distanceKm, formatDistance } from '@/lib/distance';
import { useCatalog } from '@/state/CatalogContext';
import { useCart } from '@/state/CartContext';
import { unavailableKeysFor } from '@/state/cartReducer';
import { useLocation } from '@/state/LocationContext';
import { font, radius, spacing, useColors } from '@/theme';
import type { Branch } from '@/types/catalog';

/** Branch picker modal: choose a branch manually or by current location. */
export default function BranchPickerScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, dispatch } = useCart();
  const { status, coords, locateNearest } = useLocation();
  const { catalog } = useCatalog();

  const branches = coords
    ? [...catalog.branches].sort((a, b) => distanceKm(coords, a) - distanceKm(coords, b))
    : catalog.branches;

  /** Selects a branch, confirming first if some cart items are not sold there. */
  const choose = (branch: Branch) => {
    const removeKeys = unavailableKeysFor(state, branch.id, catalog);
    const confirm = () => {
      dispatch({ type: 'setBranch', branchId: branch.id, removeKeys });
      router.back();
    };
    if (removeKeys.length === 0 || branch.id === state.branchId) return confirm();

    const names = removeKeys
      .map((key) => findProduct(state.lines.find((l) => l.key === key)?.productId ?? '', catalog)?.name)
      .filter(Boolean)
      .join(', ');
    Alert.alert(
      `Switch to ${branch.name}?`,
      `${branch.name} doesn't carry: ${names}. These will be removed from your cart.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch branch', style: 'destructive', onPress: confirm },
      ],
    );
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.locate}>
        <Button
          title={status === 'locating' ? 'Locating…' : 'Use my location'}
          variant="secondary"
          disabled={status === 'locating'}
          onPress={locateNearest}
        />
        {status === 'denied' && (
          <View style={styles.hint}>
            <Text style={[font.caption, { color: colors.textMuted }]}>
              Location permission is off. Pick a branch below, or enable it in Settings.
            </Text>
            <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()} hitSlop={8}>
              <Text style={[font.caption, { color: colors.accent, fontWeight: '600' }]}>Open Settings</Text>
            </Pressable>
          </View>
        )}
        {status === 'error' && (
          <Text style={[font.caption, { color: colors.warning }]}>
            Couldn’t get your location. Pick a branch below.
          </Text>
        )}
      </View>

      {branches.map((branch, index) => {
        const selected = branch.id === state.branchId;
        const nearest = coords !== null && index === 0;
        return (
          <Pressable
            key={branch.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => choose(branch)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: colors.surface,
                borderColor: selected ? colors.accent : colors.surface,
                borderWidth: 2,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View style={styles.rowText}>
              <View style={styles.titleRow}>
                <Text style={[font.heading, { color: colors.text }]}>{branch.name}</Text>
                {nearest && (
                  <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[font.caption, { color: colors.accent, fontWeight: '600' }]}>Nearest</Text>
                  </View>
                )}
              </View>
              <Text style={[font.caption, { color: colors.textMuted }]}>{branch.address}</Text>
              <Text style={[font.caption, { color: colors.textMuted }]}>
                {coords ? `${formatDistance(distanceKm(coords, branch))} · ` : ''}
                {branch.hours}
              </Text>
            </View>
            {selected && <Text style={[font.heading, { color: colors.accent }]}>✓</Text>}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  locate: { gap: spacing.sm, marginBottom: spacing.sm },
  hint: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
});
