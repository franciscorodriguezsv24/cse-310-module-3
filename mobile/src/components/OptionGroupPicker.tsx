import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '@/lib/pricing';
import type { OptionGroup } from '@/types/catalog';
import { font, radius, spacing, useColors } from '@/theme';

interface OptionGroupPickerProps {
  group: OptionGroup;
  selected: string[];
  onChange: (selected: string[]) => void;
  currency: string;
}

/** Radio list (single) or checkbox list (multiple, up to max) for one option group. */
export function OptionGroupPicker({ group, selected, onChange, currency }: OptionGroupPickerProps) {
  const colors = useColors();
  const isSingle = group.type === 'single';
  const max = group.max ?? group.choices.length;
  const atMax = !isSingle && selected.length >= max;

  /** Applies a tap: replaces the choice for single groups, toggles it for multiple groups. */
  const toggle = (choiceId: string) => {
    if (isSingle) return onChange([choiceId]);
    if (selected.includes(choiceId)) return onChange(selected.filter((id) => id !== choiceId));
    if (!atMax) onChange([...selected, choiceId]);
  };

  return (
    <View style={styles.group}>
      <View style={styles.header}>
        <Text style={[font.heading, { color: colors.text }]}>{group.name}</Text>
        <Text style={[font.caption, { color: colors.textMuted }]}>{isSingle ? 'Choose 1' : `Up to ${max}`}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {group.choices.map((choice, index) => {
          const isOn = selected.includes(choice.id);
          const disabled = !isOn && atMax;
          return (
            <Pressable
              key={choice.id}
              accessibilityRole={isSingle ? 'radio' : 'checkbox'}
              accessibilityState={{ checked: isOn, disabled }}
              disabled={disabled}
              onPress={() => toggle(choice.id)}
              style={({ pressed }) => [
                styles.row,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  isSingle ? styles.radio : styles.checkbox,
                  {
                    borderColor: isOn ? colors.accent : colors.textMuted,
                    backgroundColor: isOn && !isSingle ? colors.accent : 'transparent',
                  },
                ]}
              >
                {isOn && isSingle && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
                {isOn && !isSingle && <Text style={[styles.check, { color: colors.accentText }]}>✓</Text>}
              </View>
              <Text style={[font.body, styles.choiceName, { color: colors.text }]}>{choice.name}</Text>
              {choice.priceDelta !== 0 && (
                <Text style={[font.body, { color: colors.textMuted, fontVariant: ['tabular-nums'] }]}>
                  {choice.priceDelta > 0 ? '+' : ''}
                  {formatMoney(choice.priceDelta, currency)}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  card: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48, paddingHorizontal: spacing.lg },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  check: { fontSize: 14, fontWeight: '800', lineHeight: 16 },
  choiceName: { flex: 1 },
});
