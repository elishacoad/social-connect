import { Link, router } from 'expo-router';
import { Camera, ClockCounterClockwise, QrCode, type Icon } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const { width } = Dimensions.get('window');

type Slide = {
  icon: Icon;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: Camera,
    title: 'Capture moments as they happen',
    body: 'Snap a photo when something happens in person. No filters, no scrolling back through a feed.',
  },
  {
    icon: QrCode,
    title: 'Connect when you’re actually together',
    body: 'Scan each other’s code in person to become friends. No searching, no adding strangers.',
  },
  {
    icon: ClockCounterClockwise,
    title: 'Friendships fade if you don’t show up',
    body: 'Stay close in real life and a friendship stays vivid. Drift apart, and it fades — just like real life.',
  },
];

export default function WelcomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  }

  function handleNext() {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    } else {
      router.push('/sign-up');
    }
  }

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        className="flex-1">
        {SLIDES.map((slide) => (
          <View key={slide.title} style={{ width }} className="flex-1 items-center justify-center gap-6 px-8">
            <View className="bg-muted size-24 items-center justify-center rounded-full">
              <slide.icon size={40} weight="duotone" />
            </View>
            <View className="gap-2">
              <Text variant="h3" className="text-center">
                {slide.title}
              </Text>
              <Text variant="muted" className="text-center">
                {slide.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="gap-6 px-6 pb-4">
        <View className="flex-row items-center justify-center gap-2">
          {SLIDES.map((slide, i) => (
            <View
              key={slide.title}
              className={cn('h-1.5 rounded-full', i === index ? 'bg-primary w-6' : 'bg-muted w-1.5')}
            />
          ))}
        </View>

        <Button onPress={handleNext}>
          <Text>{isLast ? 'Get started' : 'Next'}</Text>
        </Button>

        <View className="flex-row justify-center gap-1">
          <Text variant="muted">Already have an account?</Text>
          <Link href="/sign-in">
            <Text className="text-primary font-medium">Sign in</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
