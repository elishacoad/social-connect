import { Link, router } from 'expo-router';
import { Camera01Icon, HistoryIcon, QrCodeIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { IconSvgElement } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Dimensions, Platform, useColorScheme, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

type SlideData = {
  icon: IconSvgElement;
  title: string;
  body: string;
};

const SLIDES: SlideData[] = [
  {
    icon: Camera01Icon,
    title: 'Capture moments as they happen',
    body: 'Snap a photo when something happens in person. No filters, no scrolling back through a feed.',
  },
  {
    icon: QrCodeIcon,
    title: 'Connect when you’re actually together',
    body: 'Scan each other’s code in person to become friends. No searching, no adding strangers.',
  },
  {
    icon: HistoryIcon,
    title: 'Friendships fade if you don’t show up',
    body: 'Stay close in real life and a friendship stays vivid. Drift apart, and it fades — just like real life.',
  },
];

function useSlideOffset(scrollX: SharedValue<number>, index: number) {
  return useAnimatedStyle(() => {
    const distance = scrollX.value / width - index;
    return {
      opacity: interpolate(Math.abs(distance), [0, 0.75], [1, 0], Extrapolation.CLAMP),
    };
  });
}

function Slide({
  slide,
  index,
  scrollX,
  iconColor,
}: {
  slide: SlideData;
  index: number;
  scrollX: SharedValue<number>;
  iconColor: string;
}) {
  const fade = useSlideOffset(scrollX, index);

  const medallionStyle = useAnimatedStyle(() => {
    const distance = scrollX.value / width - index;
    return {
      transform: [
        { translateX: interpolate(distance, [-1, 1], [width * 0.22, -width * 0.22]) },
        { scale: interpolate(Math.abs(distance), [0, 1], [1, 0.82], Extrapolation.CLAMP) },
      ],
    };
  });

  const copyStyle = useAnimatedStyle(() => {
    const distance = scrollX.value / width - index;
    return {
      transform: [
        { translateX: interpolate(distance, [-1, 1], [width * 0.08, -width * 0.08]) },
        { translateY: interpolate(Math.abs(distance), [0, 1], [0, 16], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <View style={{ width }} className="flex-1 items-center justify-center gap-10 px-8 pb-8">
      <Animated.View style={[fade, medallionStyle]} className="items-center justify-center">
        <View className="bg-muted/40 size-44 items-center justify-center rounded-full">
          <View className="bg-muted size-32 items-center justify-center rounded-full">
            <HugeiconsIcon icon={slide.icon} size={48} strokeWidth={1.25} color={iconColor} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[fade, copyStyle]} className="max-w-[320px] gap-3">
        <Text
          variant="h3"
          className="text-center text-[26px] leading-[34px]"
          style={Platform.select({ ios: { letterSpacing: -0.4 } })}>
          {slide.title}
        </Text>
        <Text variant="muted" className="text-center text-[15px] leading-[23px]">
          {slide.body}
        </Text>
      </Animated.View>
    </View>
  );
}

function Dot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value / width - index);
    return {
      width: interpolate(distance, [0, 1], [24, 6], Extrapolation.CLAMP),
      opacity: interpolate(distance, [0, 1], [1, 0.22], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={style} className="bg-foreground h-1.5 rounded-full" />;
}

export default function WelcomeScreen() {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const scheme = useColorScheme();
  const iconColor = scheme === 'dark' ? Colors.dark.text : Colors.light.text;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  function handleMomentumEnd(event: { nativeEvent: { contentOffset: { x: number } } }) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  }

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    } else {
      router.push('/sign-up');
    }
  }

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView className="bg-background flex-1">
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        className="flex-1">
        {SLIDES.map((slide, i) => (
          <Slide key={slide.title} slide={slide} index={i} scrollX={scrollX} iconColor={iconColor} />
        ))}
      </Animated.ScrollView>

      <View className="gap-7 px-6 pb-2">
        <View className="h-1.5 flex-row items-center justify-center gap-2">
          {SLIDES.map((slide, i) => (
            <Dot key={slide.title} index={i} scrollX={scrollX} />
          ))}
        </View>

        <Button
          size="lg"
          onPress={handleNext}
          className="h-14 rounded-2xl active:scale-[0.96]"
          accessibilityLabel={isLast ? 'Get started' : 'Next slide'}>
          <Text className="text-base font-semibold">{isLast ? 'Get started' : 'Next'}</Text>
        </Button>

        <View className="flex-row items-center justify-center gap-1.5">
          <Text variant="muted">Already have an account?</Text>
          <Link href="/sign-in" className="px-2 py-2">
            <Text className="text-primary text-sm font-semibold">Sign in</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
