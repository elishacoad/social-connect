import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type AvatarPerson = {
  display_name?: string | null;
  avatar_url?: string | null;
};

// Keyed by the Tailwind size step. Static strings, not interpolation —
// NativeWind resolves classNames at build time and cannot see `size-${n}`.
const SIZES = {
  6: { root: 'size-6', initial: 'text-micro' },
  8: { root: 'size-8', initial: 'text-caption' },
  9: { root: 'size-9', initial: 'text-caption' },
  10: { root: 'size-10', initial: 'text-footnote' },
  11: { root: 'size-11', initial: 'text-body' },
  24: { root: 'size-24', initial: 'font-sans-semibold text-h2' },
} as const;

type AvatarSize = keyof typeof SIZES;

function initialOf(name?: string | null) {
  return name?.trim().charAt(0).toUpperCase() || '?';
}

export function UserAvatar({
  person,
  size = 10,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Avatar>, 'alt'> & {
  person: AvatarPerson | null | undefined;
  size?: AvatarSize;
}) {
  const { root, initial } = SIZES[size];

  return (
    <Avatar alt={person?.display_name ?? ''} className={cn(root, className)} {...props}>
      {person?.avatar_url ? (
        <AvatarImage source={{ uri: person.avatar_url }} />
      ) : (
        <AvatarFallback>
          {/* border-0 undoes the Input-ish border RNR's Text inherits inside a fallback */}
          <Text className={cn('border-0', initial)}>{initialOf(person?.display_name)}</Text>
        </AvatarFallback>
      )}
    </Avatar>
  );
}
