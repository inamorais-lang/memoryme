import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet } from "react-native";

import { AppText, border, colors, radius, shadow, space } from "@/design";

/** Pill to pick one option (scene, funny extra, pet sex). */
export function Chip(props: {
  label: string;
  /** Coloured chip (pet sex): keeps its colour and gets an outline when selected. */
  tint?: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        props.onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        props.tint
          ? [
              { backgroundColor: props.tint },
              props.selected && styles.tintSelected,
            ]
          : props.selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <AppText
        variant="smallStrong"
        color={props.selected && !props.tint ? colors.onPrimary : colors.ink}
      >
        {props.label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    boxShadow: shadow.sm,
  },
  selected: { backgroundColor: colors.primary },
  // Same size as an unselected chip: the outline replaces part of the padding.
  tintSelected: {
    borderWidth: border.widthBold,
    borderColor: border.color,
    paddingHorizontal: space.md - border.widthBold,
    paddingVertical: space.sm - border.widthBold,
  },
  pressed: { opacity: 0.85 },
});
