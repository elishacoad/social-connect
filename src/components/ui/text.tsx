import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

/**
 * The single source of truth for typography. Every variant bakes in family,
 * size, line height and tracking together, so screens choose a *role*
 * ("this is a caption") rather than assembling one from loose utilities.
 *
 * Weight is carried by the font family (font-sans-semibold), never by
 * font-semibold — see src/lib/fonts.ts.
 */
const textVariants = cva(
  cn('text-foreground font-sans text-body', Platform.select({ web: 'select-text' })),
  {
    variants: {
      variant: {
        // Display — Fraunces. Reserved for a screen's single loudest line.
        display: 'font-display-bold text-display tracking-tight',
        h1: 'font-display-bold text-h1 tracking-tight',
        h2: 'font-display text-h2 tracking-tight',
        h3: 'font-display text-h3 tracking-tight',

        // UI — Figtree.
        title: 'font-sans-semibold text-title',
        body: '',
        bodyStrong: 'font-sans-semibold',
        label: 'text-muted-foreground font-sans-medium text-footnote',
        muted: 'text-muted-foreground text-footnote',
        caption: 'text-muted-foreground text-caption',
        overline: 'text-muted-foreground font-sans-medium text-overline uppercase tracking-widest',
        micro: 'text-muted-foreground text-micro',
      },
    },
    defaultVariants: {
      variant: 'body',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  display: 'heading',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  display: '1',
  h1: '1',
  h2: '2',
  h3: '3',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'body',
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext, textVariants };
