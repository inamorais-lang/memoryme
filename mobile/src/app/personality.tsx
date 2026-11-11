import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  AppText,
  border,
  Button,
  colors,
  radius,
  Screen,
  shadow,
  space,
  TextField,
} from "@/design";
import { useAuth } from "@/features/auth/AuthContext";
import {
  backend,
  BackendError,
  CUSTOM_SCENE_MAX,
  CUSTOM_SCENE_MIN,
  type PersonalityInfo,
  type SceneChoice,
  type SceneInfo,
} from "@/features/backend";
import { useDraft } from "@/features/draft/DraftContext";
import { currentLanguage, currentMarket } from "@/i18n";

export default function PersonalityScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const auth = useAuth();
  const [list, setList] = useState<PersonalityInfo[] | null>(null);
  const [scenes, setScenes] = useState<SceneInfo[]>([]);
  const [starting, setStarting] = useState(false);
  const waitingForSignIn = useRef(false);

  useEffect(() => {
    backend
      .listPersonalities(currentMarket())
      .then(setList)
      .catch(() => setList([]));
    backend
      .listScenes(currentLanguage())
      .then(setScenes)
      .catch(() => setScenes([]));
  }, []);

  const customText = draft.customScene.replace(/\s+/g, " ").trim();
  const isCustom = draft.scene.kind === "custom";
  const sceneReady = !isCustom || customText.length >= CUSTOM_SCENE_MIN;
  // Comedy scenes are exaggerated already: no extra option (and no extra credit).
  const selectedPreset =
    draft.scene.kind === "preset"
      ? scenes.find((s) => s.id === (draft.scene as { id: string }).id)
      : undefined;
  const canExaggerate = scenes.length > 0 && !selectedPreset?.exaggerated;
  const exaggerated = canExaggerate && draft.exaggerated;
  const cost = (isCustom ? 2 : 1) + (exaggerated ? 1 : 0);

  const start = useCallback(async () => {
    if (!draft.photo || !draft.personalityId) return;
    if (backend.mode === "remote" && !auth.session) {
      waitingForSignIn.current = true;
      router.push("/sign-in");
      return;
    }
    if (!sceneReady) return;
    const scene: SceneChoice = {
      ...(draft.scene.kind === "preset"
        ? { sceneId: draft.scene.id }
        : draft.scene.kind === "custom"
          ? { customScene: customText }
          : {}),
      ...(exaggerated ? { exaggerated: true } : {}),
    };
    setStarting(true);
    try {
      const id = await backend.createTranslation(
        draft.photo,
        draft.personalityId,
        scene,
      );
      router.push({ pathname: "/result", params: { id } });
    } catch (e) {
      const code = e instanceof BackendError ? e.code : "server_error";
      if (code === "insufficient_credits") router.push("/no-credits");
      else if (code === "auth_required") router.push("/sign-in");
      else if (code === "rate_limited") Alert.alert(t("result.rateLimited"));
      else if (code === "daily_limit") Alert.alert(t("result.dailyLimit"));
      else if (code === "network") Alert.alert(t("result.network"));
      else if (code === "invalid_scene") Alert.alert(t("scene.invalid"));
      else Alert.alert(t("result.errorTitle"), t("result.errorBody"));
    } finally {
      setStarting(false);
      auth.refreshCredits();
    }
  }, [
    draft.photo,
    draft.personalityId,
    draft.scene,
    customText,
    sceneReady,
    exaggerated,
    auth,
    t,
  ]);

  // Coming back from "Sign in with Apple": carry on with the translation.
  useEffect(() => {
    if (waitingForSignIn.current && auth.session) {
      waitingForSignIn.current = false;
      start();
    }
  }, [auth.session, start]);

  if (!draft.photo) return <Redirect href="/" />;

  function select(id: string) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    draft.setPersonality(id);
  }

  return (
    <Screen
      footer={
        <Button
          testID="translate"
          label={
            !draft.personalityId
              ? t("personality.pickFirst")
              : !sceneReady
                ? t("scene.tooShort")
                : t("personality.translate", { count: cost })
          }
          disabled={!draft.personalityId || !sceneReady}
          loading={starting}
          onPress={start}
        />
      }
    >
      <View style={styles.header}>
        <Image
          source={{ uri: draft.photo.uri }}
          style={styles.thumb}
          contentFit="cover"
        />
        <View style={styles.headerText}>
          <AppText variant="title">{t("personality.title")}</AppText>
          <AppText color={colors.inkMuted}>{t("personality.subtitle")}</AppText>
        </View>
      </View>

      {list === null ? <ActivityIndicator color={colors.ink} /> : null}
      {list?.length === 0 ? (
        <AppText color={colors.inkMuted}>{t("result.network")}</AppText>
      ) : null}

      <View style={styles.grid}>
        {(list ?? []).map((p, index) => {
          const selected = draft.personalityId === p.id;
          return (
            <Pressable
              key={p.id}
              testID={`personality-${p.id}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${p.name}. ${p.tagline}`}
              onPress={() => select(p.id)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor:
                    colors.accents[index % colors.accents.length],
                },
                selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <AppText variant="heading">{p.name}</AppText>
              <AppText variant="small" color={colors.ink}>
                {p.tagline}
              </AppText>
              {selected ? (
                <View style={styles.badge}>
                  <AppText variant="smallStrong" color={colors.onPrimary}>
                    {t("personality.selected")}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {scenes.length > 0 ? (
        <View style={styles.sceneSection}>
          <View style={styles.headerText}>
            <AppText variant="heading">{t("scene.title")}</AppText>
            <AppText color={colors.inkMuted}>{t("scene.subtitle")}</AppText>
          </View>
          {scenes.some((s) => s.category === "natal") ? (
            <View style={styles.sceneGroup}>
              <AppText variant="bodyStrong">{t("scene.christmas")}</AppText>
              <View style={styles.chips}>
                {scenes
                  .filter((s) => s.category === "natal")
                  .map((s) => (
                    <SceneChip
                      key={s.id}
                      testID={`scene-${s.id}`}
                      label={s.name}
                      selected={
                        draft.scene.kind === "preset" && draft.scene.id === s.id
                      }
                      onPress={() =>
                        draft.setScene({ kind: "preset", id: s.id })
                      }
                    />
                  ))}
              </View>
            </View>
          ) : null}
          <View style={styles.chips}>
            <SceneChip
              testID="scene-mood"
              label={t("scene.mood")}
              selected={draft.scene.kind === "mood"}
              onPress={() => draft.setScene({ kind: "mood" })}
            />
            {scenes
              .filter((s) => !s.category)
              .map((s) => (
                <SceneChip
                  key={s.id}
                  testID={`scene-${s.id}`}
                  label={s.name}
                  selected={
                    draft.scene.kind === "preset" && draft.scene.id === s.id
                  }
                  onPress={() => draft.setScene({ kind: "preset", id: s.id })}
                />
              ))}
            <SceneChip
              testID="scene-custom"
              label={t("scene.custom")}
              selected={isCustom}
              onPress={() => draft.setScene({ kind: "custom" })}
            />
          </View>
          {isCustom ? (
            <View style={styles.customScene}>
              <AppText variant="small" color={colors.inkMuted}>
                {t("scene.customHint")}
              </AppText>
              <TextField
                testID="custom-scene"
                value={draft.customScene}
                onChangeText={draft.setCustomScene}
                placeholder={t("scene.customPlaceholder")}
                maxLength={CUSTOM_SCENE_MAX}
                counterLabel={t("result.charsLeft", {
                  count: CUSTOM_SCENE_MAX - draft.customScene.length,
                })}
                returnKeyType="done"
                autoFocus
              />
            </View>
          ) : null}
          {canExaggerate ? (
            <View style={styles.customScene}>
              <View style={styles.chips}>
                <SceneChip
                  testID="exaggerated"
                  label={t("scene.exaggerated")}
                  selected={exaggerated}
                  onPress={() => draft.setExaggerated(!draft.exaggerated)}
                />
              </View>
              <AppText variant="small" color={colors.inkMuted}>
                {t("scene.exaggeratedHint")}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

function SceneChip(props: {
  label: string;
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
        props.selected && styles.chipSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <AppText
        variant="smallStrong"
        color={props.selected ? colors.onPrimary : colors.ink}
      >
        {props.label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: space.lg, alignItems: "center" },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    transform: [{ rotate: "-4deg" }],
    boxShadow: shadow.md,
  },
  headerText: { flex: 1, gap: space.xs },
  grid: { gap: space.md },
  card: {
    padding: space.lg,
    gap: space.xs,
    borderRadius: radius.md,
    borderWidth: border.widthBold,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: border.color,
    boxShadow: shadow.md,
    transform: [{ scale: 1.02 }],
  },
  cardPressed: { opacity: 0.85 },
  sceneSection: { gap: space.md, marginTop: space.lg },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  sceneGroup: { gap: space.sm },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    boxShadow: shadow.sm,
  },
  chipSelected: { backgroundColor: colors.primary },
  customScene: { gap: space.sm },
  badge: {
    alignSelf: "flex-start",
    marginTop: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
