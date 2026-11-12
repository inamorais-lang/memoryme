import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
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
  type SceneInfo,
  type TranslationChoice,
} from "@/features/backend";
import { hasAiConsent } from "@/features/consent/aiConsent";
import { type DraftChoice, useDraft } from "@/features/draft/DraftContext";
import {
  loadPetProfile,
  PET_NAME_MAX,
  type PetProfile,
  type PetSex,
  savePetProfile,
} from "@/features/pet/petProfile";
import { currentLanguage, currentMarket } from "@/i18n";

export default function PersonalityScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const auth = useAuth();
  const [list, setList] = useState<PersonalityInfo[] | null>(null);
  const [scenes, setScenes] = useState<SceneInfo[]>([]);
  const [starting, setStarting] = useState(false);
  const [pet, setPet] = useState<PetProfile>({});
  useEffect(() => {
    loadPetProfile().then(setPet);
  }, []);
  function updatePet(next: PetProfile) {
    setPet(next);
    savePetProfile(next);
  }
  function toggleSex(sex: PetSex) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    updatePet({ ...pet, sex: pet.sex === sex ? undefined : sex });
  }
  const waitingForSignIn = useRef(false);
  const waitingForConsent = useRef(false);

  useEffect(() => {
    backend
      .listPersonalities(currentMarket())
      .then(setList)
      .catch(() => setList([]));
    backend
      .listScenes(currentLanguage(), currentMarket())
      .then(setScenes)
      .catch(() => setScenes([]));
  }, []);

  const customText = draft.customScene.replace(/\s+/g, " ").trim();
  const choice = draft.choice;
  const isCustom = choice?.kind === "custom";
  const choiceReady =
    choice !== null && (!isCustom || customText.length >= CUSTOM_SCENE_MIN);
  const cost = isCustom ? 2 : 1;
  const trending = scenes.filter(
    (s) => s.kind === "place" && s.category === "trend",
  );
  const christmas = scenes.filter(
    (s) => s.kind === "place" && s.category === "natal",
  );
  const places = scenes.filter(
    (s) =>
      s.kind === "place" && s.category !== "natal" && s.category !== "trend",
  );
  const comics = scenes.filter((s) => s.kind === "comic");

  const start = useCallback(async () => {
    if (!draft.photo || !choice) return;
    // The photo goes to third-party AI services: ask once, before anything is uploaded.
    if (backend.mode === "remote" && !(await hasAiConsent())) {
      waitingForConsent.current = true;
      router.push("/ai-consent");
      return;
    }
    if (backend.mode === "remote" && !auth.session) {
      waitingForSignIn.current = true;
      router.push("/sign-in");
      return;
    }
    if (!choiceReady) return;
    const petName = pet.name?.replace(/\s+/g, " ").trim();
    const extra = {
      ...(draft.comicId ? { comicId: draft.comicId } : {}),
      ...(pet.sex ? { petSex: pet.sex } : {}),
      ...(petName ? { petName } : {}),
    };
    const request: TranslationChoice =
      choice.kind === "mode"
        ? { personalityId: choice.id, ...extra }
        : choice.kind === "scene"
          ? { sceneId: choice.id, ...extra }
          : { customScene: customText, ...extra };
    setStarting(true);
    try {
      const id = await backend.createTranslation(draft.photo, request);
      router.push({ pathname: "/result", params: { id } });
    } catch (e) {
      const code = e instanceof BackendError ? e.code : "server_error";
      if (code === "insufficient_credits") router.push("/credits");
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
    choice,
    draft.comicId,
    customText,
    choiceReady,
    pet,
    auth,
    t,
  ]);

  // Coming back from the AI consent screen: carry on only if the person accepted.
  useFocusEffect(
    useCallback(() => {
      if (!waitingForConsent.current) return;
      waitingForConsent.current = false;
      hasAiConsent().then((granted) => {
        if (granted) start();
      });
    }, [start]),
  );

  // Coming back from "Sign in with Apple": carry on with the translation.
  useEffect(() => {
    if (waitingForSignIn.current && auth.session) {
      waitingForSignIn.current = false;
      start();
    }
  }, [auth.session, start]);

  if (!draft.photo) return <Redirect href="/" />;

  function select(next: DraftChoice) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    draft.setChoice(next);
  }
  const isScene = (id: string) => choice?.kind === "scene" && choice.id === id;

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {choice && comics.length > 0 ? (
            <View style={styles.comics}>
              <AppText variant="smallStrong">{t("scene.comicTitle")}</AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.comicRow}
              >
                <SceneChip
                  testID="comic-none"
                  label={t("scene.comicNone")}
                  selected={draft.comicId === null}
                  onPress={() => draft.setComic(null)}
                />
                {comics.map((s) => (
                  <SceneChip
                    key={s.id}
                    testID={`comic-${s.id}`}
                    label={s.name}
                    selected={draft.comicId === s.id}
                    onPress={() => draft.setComic(s.id)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
          <Button
            testID="translate"
            label={
              !choice
                ? t("personality.pickFirst")
                : !choiceReady
                  ? t("scene.tooShort")
                  : t("personality.translate", { count: cost })
            }
            disabled={!choiceReady}
            loading={starting}
            onPress={start}
          />
        </View>
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

      {/* Optional: only to write the line (feminine or masculine words, the pet's name). */}
      <View style={styles.pet}>
        <View style={styles.chips}>
          <SceneChip
            testID="pet-male"
            label={t("pet.male")}
            selected={pet.sex === "male"}
            onPress={() => toggleSex("male")}
          />
          <SceneChip
            testID="pet-female"
            label={t("pet.female")}
            selected={pet.sex === "female"}
            onPress={() => toggleSex("female")}
          />
        </View>
        <TextField
          testID="pet-name"
          value={pet.name ?? ""}
          onChangeText={(name) =>
            updatePet({
              ...pet,
              name: name.slice(0, PET_NAME_MAX) || undefined,
            })
          }
          placeholder={t("pet.namePlaceholder")}
          maxLength={PET_NAME_MAX}
          returnKeyType="done"
          autoCapitalize="words"
        />
      </View>

      {trending.length > 0 ? (
        <View style={styles.group}>
          <AppText variant="heading">{t("scene.trending")}</AppText>
          <View style={styles.chips}>
            {trending.map((s) => (
              <SceneChip
                key={s.id}
                testID={`scene-${s.id}`}
                label={s.name}
                selected={isScene(s.id)}
                onPress={() => select({ kind: "scene", id: s.id })}
              />
            ))}
          </View>
        </View>
      ) : null}

      {christmas.length > 0 ? (
        <View style={styles.group}>
          <AppText variant="heading">{t("scene.christmas")}</AppText>
          <View style={styles.chips}>
            {christmas.map((s) => (
              <SceneChip
                key={s.id}
                testID={`scene-${s.id}`}
                label={s.name}
                selected={isScene(s.id)}
                onPress={() => select({ kind: "scene", id: s.id })}
              />
            ))}
          </View>
        </View>
      ) : null}

      {scenes.length > 0 ? (
        <View style={styles.group}>
          <AppText variant="heading">{t("scene.places")}</AppText>
          <View style={styles.chips}>
            {places.map((s) => (
              <SceneChip
                key={s.id}
                testID={`scene-${s.id}`}
                label={s.name}
                selected={isScene(s.id)}
                onPress={() => select({ kind: "scene", id: s.id })}
              />
            ))}
            <SceneChip
              testID="scene-custom"
              label={t("scene.custom")}
              selected={isCustom}
              onPress={() => select({ kind: "custom" })}
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
        </View>
      ) : null}

      {list === null ? <ActivityIndicator color={colors.ink} /> : null}
      {list?.length === 0 ? (
        <AppText color={colors.inkMuted}>{t("result.network")}</AppText>
      ) : null}

      <View style={styles.group}>
        {scenes.length > 0 && (list?.length ?? 0) > 0 ? (
          <AppText variant="heading">{t("scene.modes")}</AppText>
        ) : null}
        {(list ?? []).map((p, index) => {
          const selected = choice?.kind === "mode" && choice.id === p.id;
          return (
            <Pressable
              key={p.id}
              testID={`personality-${p.id}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${p.name}. ${p.tagline}`}
              onPress={() => select({ kind: "mode", id: p.id })}
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
  group: { gap: space.md },
  pet: { gap: space.sm },
  footer: { gap: space.md },
  comics: { gap: space.sm },
  comicRow: {
    gap: space.sm,
    paddingVertical: space.xxs,
    paddingHorizontal: space.xxs,
  },
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
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
