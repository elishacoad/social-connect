/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // One family per weight — see src/lib/fonts.ts for why weight cannot
      // be expressed as font-semibold on top of a shared family.
      fontFamily: {
        sans: ["Figtree_400Regular"],
        "sans-medium": ["Figtree_500Medium"],
        "sans-semibold": ["Figtree_600SemiBold"],
        "sans-bold": ["Figtree_700Bold"],
        display: ["Fraunces_600SemiBold"],
        "display-bold": ["Fraunces_700Bold"],
      },
      // Semantic type scale. Line height ships with the size so callers
      // never pair a size with a mismatched leading-*.
      fontSize: {
        micro: ["10px", "13px"],
        overline: ["11px", "14px"],
        caption: ["12px", "16px"],
        footnote: ["13px", "18px"],
        body: ["15px", "22px"],
        // No line height on purpose: a single-line TextInput centres on its
        // font box, so an explicit lineHeight pushes the text off-centre.
        input: "15px",
        title: ["18px", "24px"],
        h3: ["20px", "26px"],
        h2: ["24px", "30px"],
        h1: ["28px", "34px"],
        display: ["32px", "38px"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
    },
  },
  plugins: [],
};
