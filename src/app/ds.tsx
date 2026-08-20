import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View, useColorScheme } from 'react-native';

import { MomentActionsMenu } from '@/components/moment-actions-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { UserAvatar } from '@/components/user-avatar';
import { Colors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

const TEXT_VARIANTS = [
  { variant: 'display', spec: 'Fraunces Bold · 32/38 · tight' },
  { variant: 'h1', spec: 'Fraunces Bold · 28/34 · tight' },
  { variant: 'h2', spec: 'Fraunces SemiBold · 24/30 · tight' },
  { variant: 'h3', spec: 'Fraunces SemiBold · 20/26 · tight' },
  { variant: 'title', spec: 'Figtree SemiBold · 18/24' },
  { variant: 'body', spec: 'Figtree Regular · 15/22' },
  { variant: 'bodyStrong', spec: 'Figtree SemiBold · 15/22' },
  { variant: 'label', spec: 'Figtree Medium · 13/18 · muted' },
  { variant: 'muted', spec: 'Figtree Regular · 13/18 · muted' },
  { variant: 'caption', spec: 'Figtree Regular · 12/16 · muted' },
  { variant: 'overline', spec: 'Figtree Medium · 11/14 · caps, widest' },
  { variant: 'micro', spec: 'Figtree Regular · 10/13 · muted' },
] as const;

const BUTTON_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const;
const BUTTON_SIZES = ['sm', 'default', 'lg', 'pill'] as const;
const AVATAR_SIZES = [6, 8, 9, 10, 11, 24] as const;

const SAMPLE = { display_name: 'Elisha Coad', avatar_url: null };

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <View className="gap-4 border-t border-border px-6 py-8">
      <View className="gap-1">
        <Text variant="overline">{title}</Text>
        {note ? <Text variant="muted">{note}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="w-24">
        <Text variant="micro">{label}</Text>
      </View>
      <View className="flex-1 flex-row flex-wrap items-center gap-2">{children}</View>
    </View>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <View className="w-[30%] gap-1.5">
      <View className="h-14 w-full rounded-xl border border-border" style={{ backgroundColor: value }} />
      <Text variant="micro">{name}</Text>
      <Text variant="micro" className="tabular-nums opacity-60">
        {value}
      </Text>
    </View>
  );
}

export default function DesignSystemScreen() {
  const colors = useThemeColors();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [text, setText] = useState('');

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Design system' }} />
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-16">
        <View className="gap-1 px-6 pb-2 pt-4">
          <Text variant="h1">Design system</Text>
          <Text variant="muted">
            Every primitive rendered from the same tokens the app uses. Toggle the device between
            light and dark to review both — this page has no hardcoded colours.
          </Text>
        </View>

        <Section
          title="Typography"
          note="Pick a variant, never a size + weight pair. Weight rides on the family (see src/lib/fonts.ts).">
          <View className="gap-5">
            {TEXT_VARIANTS.map(({ variant, spec }) => (
              <View key={variant} className="gap-1">
                <Text variant="micro" className="tabular-nums">
                  {variant} — {spec}
                </Text>
                <Text variant={variant}>Friends fade unless you show up</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title={`Colour — ${scheme}`} note="constants/theme.ts, verified against global.css by theme.contract.test.ts.">
          <View className="flex-row flex-wrap gap-3">
            {Object.entries(Colors[scheme]).map(([name, value]) => (
              <Swatch key={name} name={name} value={value} />
            ))}
          </View>
        </Section>

        <Section title="Buttons" note="Variant sets the fill; size sets the shape. `loading` keeps the fill and swaps the label.">
          <View className="gap-5">
            {BUTTON_VARIANTS.map((variant) => (
              <Row key={variant} label={variant}>
                <Button variant={variant}>
                  <Text>Connect</Text>
                </Button>
                <Button variant={variant} disabled>
                  <Text>Disabled</Text>
                </Button>
                <Button variant={variant} loading>
                  <Text>Loading</Text>
                </Button>
              </Row>
            ))}
          </View>
        </Section>

        <Section title="Button sizes">
          <View className="gap-5">
            {BUTTON_SIZES.map((size) => (
              <Row key={size} label={size}>
                <Button size={size}>
                  <Text>Capture</Text>
                </Button>
                <Button size={size} variant="outline">
                  <Text>Cancel</Text>
                </Button>
              </Row>
            ))}
            <Row label="iconPill">
              <Button size="iconPill">
                <Text>1</Text>
              </Button>
              <Button size="iconPill" variant="outline">
                <Text>2</Text>
              </Button>
              <Button size="iconPill" loading />
            </Row>
          </View>
        </Section>

        <Section title="Inputs" note="Single-line inputs deliberately carry no line height — it pushes the text off-centre.">
          <View className="gap-4">
            <View className="gap-2">
              <Label nativeID="ds-name">Name</Label>
              <Input
                aria-labelledby="ds-name"
                value={text}
                onChangeText={setText}
                placeholder="Your name"
                className="h-14 rounded-2xl px-4"
              />
            </View>
            <View className="gap-2">
              <Label nativeID="ds-default">Default height</Label>
              <Input aria-labelledby="ds-default" placeholder="Placeholder" />
            </View>
            <View className="gap-2">
              <Label nativeID="ds-disabled">Disabled</Label>
              <Input aria-labelledby="ds-disabled" value="Not editable" editable={false} />
            </View>
            <View className="gap-2">
              <Label nativeID="ds-multi">Multiline (opts into leading-5)</Label>
              <Input
                aria-labelledby="ds-multi"
                placeholder="A few words about you"
                multiline
                textAlignVertical="top"
                className="h-24 rounded-2xl px-4 py-3 leading-5"
              />
            </View>
          </View>
        </Section>

        <Section title="Avatars" note="Keyed by Tailwind size step; the initial's size comes with it.">
          <View className="gap-5">
            <Row label="with image">
              {AVATAR_SIZES.map((size) => (
                <UserAvatar
                  key={size}
                  size={size}
                  person={{ display_name: 'Elisha', avatar_url: 'https://i.pravatar.cc/200' }}
                />
              ))}
            </Row>
            <Row label="fallback">
              {AVATAR_SIZES.map((size) => (
                <UserAvatar key={size} size={size} person={SAMPLE} />
              ))}
            </Row>
            <Row label="missing">
              {AVATAR_SIZES.map((size) => (
                <UserAvatar key={size} size={size} person={null} />
              ))}
            </Row>
          </View>
        </Section>

        <Section title="Radius" note="rounded-full and rounded-2xl carry almost everything; the rest are RNR defaults.">
          <View className="flex-row flex-wrap gap-3">
            {['rounded-md', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full'].map((radius) => (
              <View key={radius} className="items-center gap-1.5">
                <View className={`size-16 bg-muted ${radius}`} />
                <Text variant="micro">{radius.replace('rounded-', '')}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Surfaces" note="Semantic background tokens, not raw greys.">
          <View className="gap-2">
            {['bg-background', 'bg-card', 'bg-muted', 'bg-secondary', 'bg-accent', 'bg-primary'].map((surface) => (
              <View
                key={surface}
                className={`flex-row items-center justify-between rounded-xl border border-border px-4 py-3 ${surface}`}>
                <Text variant="caption">{surface}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Overflow menu" note="MomentActionsMenu — tap to open the sheet.">
          <View className="flex-row items-center gap-3">
            <MomentActionsMenu onEdit={() => {}} onDelete={() => {}} />
            <Text variant="muted">Own-post actions</Text>
          </View>
        </Section>

        <Section title="Icon colour" note="Icons take plain values from useThemeColors(), never classNames.">
          <View className="flex-row flex-wrap gap-3">
            {(['text', 'mutedForeground', 'primary', 'destructive', 'border'] as const).map((token) => (
              <View key={token} className="items-center gap-1.5">
                <View className="size-10 rounded-full" style={{ backgroundColor: colors[token] }} />
                <Text variant="micro">{token}</Text>
              </View>
            ))}
          </View>
        </Section>
      </ScrollView>
    </>
  );
}
