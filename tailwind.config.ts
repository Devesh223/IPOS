import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Indian Pixel Brand Palette
        brand: {
          main: "#011411", // Deep Obsidian Emerald
          "main-dark": "#000908", // Sunken Black Green
          dark: "#021F1B", // Dark Pine Surface
          surface: "#021F1B",
          "surface-raised": "#042924",
          light: "#F8F4ED", // Warm Pearl / Ivory
          cta: "#FFA400", // Radiant Sunset Amber
          "cta-hover": "#FFB733",
          terracotta: "#D56B4A", // Light mode CTA
          counter: "#ACBEA3", // Soft Sage Muted
        },
        // Semantic status tokens (Phase 3 EDS)
        status: {
          success: "#10B981",
          "success-subtle": "rgba(16, 185, 129, 0.12)",
          warning: "#FFA400",
          "warning-subtle": "rgba(255, 164, 0, 0.12)",
          danger: "#EF4444",
          "danger-subtle": "rgba(239, 68, 68, 0.12)",
          info: "#38BDF8",
          "info-subtle": "rgba(56, 189, 248, 0.12)",
          neutral: "#ACBEA3",
          "neutral-subtle": "rgba(172, 190, 163, 0.12)",
        },
        // Base UI System Colors
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
      fontFamily: {
        heading: ["'Montserrat Alternates'", "sans-serif"],
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        full: "9999px",
      },
      spacing: {
        "2xs": "2px",
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
        "4xl": "64px",
      },
      boxShadow: {
        "elevation-1": "0 2px 8px rgba(0, 0, 0, 0.25)",
        "elevation-2": "0 8px 24px rgba(0, 0, 0, 0.35)",
        "elevation-3": "0 16px 40px rgba(0, 0, 0, 0.45)",
        "elevation-4": "0 24px 64px rgba(0, 0, 0, 0.6)",
        "amber-glow": "0 0 25px rgba(255, 164, 0, 0.25)",
        "emerald-glow": "0 0 25px rgba(16, 185, 129, 0.2)",
      },
      zIndex: {
        base: "0",
        sticky: "10",
        dropdown: "20",
        drawer: "30",
        modal: "40",
        toast: "50",
        tooltip: "60",
      },
      animation: {
        "pulse-subtle": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-fast": "spin 0.6s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
