import { Image } from "expo-image";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Chip } from "@/components/Chip";
import {
  AppText,
  Button,
  colors,
  radius,
  Screen,
  shadow,
  space,
  TextField,
} from "@/design";
import {
  backend,
  CUSTOM_SCENE_MAX,
  CUSTOM_SCENE_MIN,
  type SceneInfo,
} from "@/features/backend";
import { type PlaceChoice, useDraft } from "@/features/draft/DraftContext";
import {
  loadPetProfile,
  type PetProfile,
  type PetSex,
  savePetProfile,
} from "@/features/pet/petProfile";
import { currentLanguage, currentMarket } from "@/i18n";

/** Step 1: where the pet is (a scene, its usual spot, one typed by the person, or a surprise). */
export default function SceneScreen() {
  const { t } = useTranslation();
  const draft = useDraft();
  const [scenes, setScenes] = useState<SceneInfo[]>([]);
  const [pet, setPet] = useState<PetProfile>({});
  useEffect(() => {
    loadPetProfile().then(setPet);
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

  if (!draft.photo) return <Redirect href="/" />;

  const place = draft.place;
  const isCustom = place?.kind === "custom";
  const customText = draft.customScene.replace(/\s+/g, " ").trim();
  const ready =
    place !== null && (!isCustom || customText.length >= CUSTOM_SCENE_MIN);
  const of = (category: string | null) =>
    scenes.filter(
      (s) =>
        s.kind === "place" &&
        (category === null
          ? s.category !== "natal" && s.category !== "trend"
          : s.category === category),
    );
  const trending = of("trend");
  const christmas = of("natal");
  const places = of(null);
  const isScene = (id: string) => place?.kind === "scene" && place.id === id;
  const select = (next: PlaceChoice) => draft.setPlace(next);
  const sceneChips = (list: SceneInfo[]) =>
    list.map((s) => (
      <Chip
        key={s.id}
        testID={`scene-${s.id}`}
        label={s.name}
        selected={isScene(s.id)}
        onPress={() => select({ kind: "scene", id: s.id })}
      />
    ));

  return (
    <Screen
      footer={
        <Button
          testID="next"
          label={
            !place
              ? t("place.pickFirst")
              : !ready
                ? t("scene.tooShort")
                : t("place.next")
          }
          disabled={!ready}
          onPress={() => router.push("/personality")}
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
          <AppText variant="title">{t("place.title")}</AppText>
          <AppText color={colors.inkMuted}>{t("place.subtitle")}</AppText>
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

      <View style={styles.chips}>
        <Chip
          testID="place-surprise"
          label={t("place.surprise")}
          selected={place?.kind === "surprise"}
          onPress={() => select({ kind: "surprise" })}
        />
        <Chip
          testID="place-home"
          label={t("place.home")}
          selected={place?.kind === "home"}
          onPress={() => select({ kind: "home" })}
        />
      </View>

      {trending.length > 0 ? (
        <View style={styles.group}>
          <AppText variant="heading">{t("scene.trending")}</AppText>
          <View style={styles.chips}>{sceneChips(trending)}</View>
        </View>
      ) : null}

      {christmas.length > 0 ? (
        <View style={styles.group}>
          <AppText variant="heading">{t("scene.christmas")}</AppText>
          <View style={styles.chips}>{sceneChips(christmas)}</View>
        </View>
      ) : null}

      <View style={styles.group}>
        <AppText variant="heading">{t("scene.places")}</AppText>
        <View style={styles.chips}>
          {sceneChips(places)}
          <Chip
            testID="scene-custom"
            label={t("scene.custom")}
            selected={isCustom}
            onPress={() => select({ kind: "custom" })}
          />
        </View>
        {isCustom ? (
          <View style={styles.group}>
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
});
