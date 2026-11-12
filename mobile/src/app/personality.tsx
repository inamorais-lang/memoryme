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
} from "@/design";
import { useAuth } from "@/features/auth/AuthContext";
import {
  backend,
  BackendError,
  type PersonalityInfo,
  type SceneInfo,
  type TranslationChoice,
} from "@/features/backend";
import { hasAiConsent } from "@/features/consent/aiConsent";
import {
  type ModeChoice,
  pickRandom,
  useDraft,
} from "@/features/draft/DraftContext";
import { loadPetProfile, type PetProfile } from "@/features/pet/petProfile";
import { currentLanguage, currentMarket } from "@/i18n";

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
    // The sex may have just been chosen on the scene screen.
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

  const customText = draft.customScene.replace(/\s+/g, " ").trim();
  const place = draft.place;
  const mode = draft.mode;
  const isCustom = place?.kind === "custom";
  const cost = isCustom ? 2 : 1;
  const comics = scenes.filter((s) => s.kind === "comic");

  const start = useCallback(async () => {
    if (!draft.photo || !mode || !list?.length) return;
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
    // "Surpreende-me": settled now, so the result shows what came out.
    const personalityId = mode.kind === "mode" ? mode.id : pickRandom(list)!.id;
    let sceneId: string | undefined;
    if (place?.kind === "scene") sceneId = place.id;
    if (place?.kind === "surprise") {
      const options = scenes.filter((s) => s.kind === "place");
      // "Its usual spot" is one of the surprises too.
      sceneId = pickRandom([...options.map((s) => s.id), undefined]);
    }
    const request: TranslationChoice = {
      personalityId,
      ...(sceneId ? { sceneId } : {}),
      ...(isCustom ? { customScene: customText } : {}),
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
  }, [
    draft.photo,
    draft.comicId,
    mode,
    place,
    list,
    scenes,
    isCustom,
    customText,
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

  function select(next: ModeChoice) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    draft.setMode(next);
  }
  const cards: {
    id: string;
    name: string;
    tagline: string;
    choice: ModeChoice;
  }[] = [
    {
      id: "surprise",
      name: t("personality.surprise"),
      tagline: t("personality.surpriseTagline"),
      choice: { kind: "surprise" },
    },
    ...(list ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      choice: { kind: "mode", id: p.id } as ModeChoice,
    })),
  ];
  const isSelected = (c: ModeChoice) =>
    mode?.kind === c.kind &&
    (c.kind === "surprise" || (mode.kind === "mode" && mode.id === c.id));

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {mode && comics.length > 0 ? (
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
              !mode
                ? t("personality.pickFirst")
                : t("personality.translate", { count: cost })
            }
            disabled={!mode || !list?.length}
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

      {list === null ? <ActivityIndicator color={colors.ink} /> : null}
      {list?.length === 0 ? (
        <AppText color={colors.inkMuted}>{t("result.network")}</AppText>
      ) : null}

      <View style={styles.group}>
        {list?.length
          ? cards.map((c, index) => {
              const selected = isSelected(c.choice);
              return (
                <Pressable
                  key={c.id}
                  testID={`personality-${c.id}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${c.name}. ${c.tagline}`}
                  onPress={() => select(c.choice)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor:
                        index === 0
                          ? colors.surface
                          : colors.accents[(index - 1) % colors.accents.length],
                    },
                    selected && styles.cardSelected,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <AppText variant="heading">{c.name}</AppText>
                  <AppText variant="small" color={colors.ink}>
                    {c.tagline}
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
  badge: {
    alignSelf: "flex-start",
    marginTop: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
