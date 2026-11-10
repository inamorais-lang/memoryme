import { Image } from 'expo-image';
import { useState, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadow } from '@/design';
import type { BalloonPosition } from '@/features/history/history';

import { ThoughtBalloon } from './ThoughtBalloon';

export type CanvasRef = React.ComponentRef<typeof View>;

type Props = {
  ref?: Ref<CanvasRef>;
  photoUri: string;
  /** Unknown for remote images until they load. */
  photoWidth?: number;
  photoHeight?: number;
  phrase?: string;
  balloonPosition: BalloonPosition;
  /** Keeps the whole image on screen; the width shrinks to respect it. */
  maxHeight?: number;
};

/** Photo + balloon. This exact view is captured as the image people share. */
export function TranslationCanvas({ ref, photoUri, photoWidth, photoHeight, phrase, balloonPosition, maxHeight }: Props) {
  const [loaded, setLoaded] = useState<{ width: number; height: number } | null>(null);
  const width0 = photoWidth ?? loaded?.width ?? 4;
  const height0 = photoHeight ?? loaded?.height ?? 5;
  const aspectRatio = clamp(width0 / height0, 0.56, 1.5);
  // The balloon is designed for a ~360pt-wide photo and scales with it.
  const [frameWidth, setFrameWidth] = useState(360);
  const balloonScale = Math.min(1, Math.max(0.65, frameWidth / 360));
  const sizing = maxHeight ? { maxWidth: maxHeight * aspectRatio, alignSelf: 'center' as const } : null;

  return (
    <View ref={ref} collapsable={false} style={[styles.frame, { aspectRatio }, sizing]} testID="translation-canvas"
      onLayout={(e) => setFrameWidth(e.nativeEvent.layout.width)}>
      <Image
        source={{ uri: photoUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        onLoad={(e) => setLoaded({ width: e.source.width, height: e.source.height })}
      />
      {phrase ? (
        <View style={[styles.balloon, balloonPosition === 'top' ? styles.top : styles.bottom]}>
          <ThoughtBalloon text={phrase} tail={balloonPosition === 'top' ? 'down' : 'up'}
            scale={balloonScale}
          />
        </View>
      ) : null}
    </View>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.inkFaint,
    boxShadow: shadow.md,
  },
  balloon: { position: 'absolute', left: '5%', right: '5%' },
  top: { top: '5%' },
  bottom: { bottom: '5%' },
});
