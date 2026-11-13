import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Haptic feedback, silent on the web. Never throws (some devices have no engine). */
const native = Platform.OS !== "web";
const safe = (p: Promise<unknown>) => p.catch(() => {});

export const haptics = {
  /** A light tap: main buttons. */
  tap: () => native && safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A selection tick: choices, balloon colour, balloon snapping to a corner. */
  select: () => native && safe(Haptics.selectionAsync()),
  /** Something good arrived: credits, a new line, the picture. */
  success: () => native && safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something failed. */
  error: () => native && safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
