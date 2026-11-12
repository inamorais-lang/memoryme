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

import { Chip } from "@/components/Chip";
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
  CUSTOM_PHRASE_MAX,
  CUSTOM_SCENE_MAX,
  CUSTOM_SCENE_MIN,
  type PersonalityInfo,
  type SceneInfo,
  type TranslationChoice,
} from "@/features/backend";
import { hasAiConsent } from "@/features/consent/aiConsent";
import { type StyleChoice, useDraft } from "@/features/draft/DraftContext";
import { pickFresh } from "@/features/draft/noRepeat";
import {
  loadPetProfile,
  type PetProfile,
  type PetSex,
  savePetProfile,
} from "@/features/pet/petProfile";
import { currentLanguage, currentMarket } from "@/i18n";

/** The person's own birthday message: same limit as the balloon. */
const RECIPIENT_MAX = CUSTOM_PHRASE_MAX;
const isBirthday = (id: string) => id.endsWith("-aniversario");

type Card = {
  key: string;
  name: string;
  tagline: string;
  choice: StyleChoice;
};

/**
 * One list of modes, one choice (product owner's decision): surprise, trending topics,
 * Natal (a Christmas scene at random), the scenes shown as modes (Compras, Aniversário,
 * Praia…), the characters (Diva, Chefe…) and "Criar o teu modo".
 */
export default function PersonalityScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const auth = useAuth();
  const [list, setList] = useState<PersonalityInfo[] | null>(null);
  const [scenes, setScenes] = useState<SceneInfo[]>([]);
  const [starting, setStarting] = useState(false);
  const [pet, setPet] = useState<PetProfile>({});
  const waitingForSignIn = useRef(false);
  const waitingForConsent = useRef(false);

  useEffect(() => {
    loadPetProfile().then(setPet);
    backend
      .listPersonalities(currentMarket())
      .then(setList)
      .catch(() => setList([]));
    backend
      .listScenes(currentLanguage(), currentMarket())
      .then(setScenes)
      .catch(() => setScenes([]));
  }, []);

  function chooseSex(sex: PetSex | undefined) {
    const next = { ...pet, sex };
    setPet(next);
    savePetProfile(next);
  }

  const choice = draft.choice;
  const customText = draft.customScene.replace(/\s+/g, " ").trim();
  const isCustom = choice?.kind === "custom";
  const cost = 1;
  const ready =
    choice !== null &&
    (!isCustom || customText.length >= CUSTOM_SCENE_MIN) &&
    !!list?.length;
  const comics = scenes.filter((s) => s.kind === "comic");
  const places = scenes.filter((s) => s.kind === "place");
  const trending = places.filter((s) => s.category === "trend");
  const christmas = places.filter((s) => s.category === "natal");
  const others = places.filter(
    (s) => s.category !== "trend" && s.category !== "natal",
  );

  const cards: Card[] = [
    {
      key: "surprise",
      name: t("personality.surprise"),
      tagline: t("personality.surpriseTagline"),
      choice: { kind: "surprise" },
    },
    ...trending.map((s) => ({
      key: s.id,
      name: s.name,
      tagline: s.tagline ?? t("personality.trendTagline"),
      choice: { kind: "scene", id: s.id } as StyleChoice,
    })),
    ...(christmas.length > 0
      ? [
          {
            key: "natal",
            name: t("personality.natal"),
            tagline: t("personality.natalTagline"),
            choice: { kind: "natal" } as StyleChoice,
          },
        ]
      : []),
    ...others.map((s) => ({
      key: s.id,
      name: s.name,
      tagline: s.tagline ?? "",
      choice: { kind: "scene", id: s.id } as StyleChoice,
    })),
    ...(list ?? []).map((p) => ({
      key: p.id,
      name: p.name,
      tagline: p.tagline,
      choice: { kind: "mode", id: p.id } as StyleChoice,
    })),
    ...(scenes.length > 0
      ? [
          {
            key: "custom",
            name: t("personality.custom"),
            tagline: t("personality.customTagline"),
            choice: { kind: "custom" } as StyleChoice,
          },
        ]
      : []),
  ];

  const start = useCallback(async () => {
    if (!draft.photo || !choice || !ready) return;
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
    // "Surpreende-me" and "Natal" are settled now, so the result shows what came out.
    let picked: StyleChoice = choice;
    // Random picks never repeat for this person until every option was used.
    if (picked.kind === "surprise") {
      const options = cards.filter(
        (c) => c.choice.kind !== "surprise" && c.choice.kind !== "custom",
      );
      const key = await pickFresh(
        "surprise",
        options.map((c) => c.key),
      );
      picked = options.find((c) => c.key === key)?.choice ?? {
        kind: "mode",
        id: list![0].id,
      };
    }
    if (picked.kind === "natal") {
      const id = await pickFresh(
        "natal",
        christmas.map((s) => s.id),
      );
      picked = { kind: "scene", id: id ?? christmas[0].id };
    }
    const recipient = draft.recipient.replace(/\s+/g, " ").trim();
    const request: TranslationChoice = {
      ...(picked.kind === "mode" ? { personalityId: picked.id } : {}),
      ...(picked.kind === "scene" ? { sceneId: picked.id } : {}),
      ...(picked.kind === "custom" ? { customScene: customText } : {}),
      ...(picked.kind === "scene" && isBirthday(picked.id) && recipient
        ? { customPhrase: recipient }
        : {}),
      ...(draft.comicId ? { comicId: draft.comicId } : {}),
      ...(pet.sex ? { petSex: pet.sex } : {}),
    };
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
    // `cards` and `christmas` are rebuilt from `list` and `scenes` on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, choice, ready, list, scenes, customText, pet, auth, t]);

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

  function select(next: StyleChoice) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    draft.setChoice(next);
  }
  const isSelected = (c: StyleChoice) =>
    choice?.kind === c.kind &&
    (!("id" in c) || ("id" in choice && choice.id === c.id));

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
                <Chip
                  testID="comic-none"
                  label={t("scene.comicNone")}
                  selected={draft.comicId === null}
                  onPress={() => draft.setComic(null)}
                />
                {comics.map((s) => (
                  <Chip
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
                : isCustom && customText.length < CUSTOM_SCENE_MIN
                  ? t("scene.tooShort")
                  : t("personality.translate", { count: cost })
            }
            disabled={!ready}
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

      {/* Optional: only to write the line with feminine or masculine words. */}
      <View style={styles.chips}>
        <Chip
          testID="pet-male"
          label={t("pet.male")}
          tint={colors.petMale}
          selected={pet.sex === "male"}
          onPress={() => chooseSex("male")}
        />
        <Chip
          testID="pet-female"
          label={t("pet.female")}
          tint={colors.petFemale}
          selected={pet.sex === "female"}
          onPress={() => chooseSex("female")}
        />
        <Chip
          testID="pet-unsaid"
          label={t("pet.unsaid")}
          tint={colors.surface}
          selected={!pet.sex}
          onPress={() => chooseSex(undefined)}
        />
      </View>

      {list === null ? <ActivityIndicator color={colors.ink} /> : null}
      {list?.length === 0 ? (
        <AppText color={colors.inkMuted}>{t("result.network")}</AppText>
      ) : null}

      <View style={styles.group}>
        {list?.length
          ? cards.map((c, index) => {
              const selected = isSelected(c.choice);
              const birthday =
                selected &&
                c.choice.kind === "scene" &&
                isBirthday(c.choice.id);
              const custom = selected && c.choice.kind === "custom";
              return (
                <View key={c.key} style={styles.cardBlock}>
                  <Pressable
                    testID={`personality-${c.key}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${c.name}. ${c.tagline}`}
                    onPress={() => select(c.choice)}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        backgroundColor:
                          c.choice.kind === "surprise" ||
                          c.choice.kind === "custom"
                            ? colors.surface
                            : colors.accents[index % colors.accents.length],
                      },
                      selected && styles.cardSelected,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <AppText variant="heading">{c.name}</AppText>
                    {c.tagline ? (
                      <AppText variant="small" color={colors.ink}>
                        {c.tagline}
                      </AppText>
                    ) : null}
                    {selected ? (
                      <View style={styles.badge}>
                        <AppText variant="smallStrong" color={colors.onPrimary}>
                          {t("personality.selected")}
                        </AppText>
                      </View>
                    ) : null}
                  </Pressable>
                  {birthday ? (
                    <View style={styles.extra}>
                      <AppText variant="small" color={colors.inkMuted}>
                        {t("personality.recipientLabel")}
                      </AppText>
                      <TextField
                        testID="recipient"
                        value={draft.recipient}
                        onChangeText={draft.setRecipient}
                        placeholder={t("personality.recipientPlaceholder")}
                        maxLength={RECIPIENT_MAX}
                        counterLabel={t("result.charsLeft", {
                          count: RECIPIENT_MAX - draft.recipient.length,
                        })}
                        returnKeyType="done"
                      />
                    </View>
                  ) : null}
                  {custom ? (
                    <View style={styles.extra}>
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
              );
            })
          : null}
      </View>
    </Screen>
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  footer: { gap: space.md },
  comics: { gap: space.sm },
  comicRow: {
    gap: space.sm,
    paddingVertical: space.xxs,
    paddingHorizontal: space.xxs,
  },
  cardBlock: { gap: space.sm },
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
  extra: { gap: space.sm, paddingHorizontal: space.xs },
  badge: {
    alignSelf: "flex-start",
    marginTop: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
