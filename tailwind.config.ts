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
        // Indian Pixel Studio Brand Palette (3-Tier Surface & Obsidian System)
        brand: {
          main: "#030706", // Level 1: Deep Canvas
          "main-dark": "#020504", // Sunken Viewport Surface
          dark: "#060D0C", // Level 2: Section Surface
          surface: "#081310", // Level 3: Interactive Object Surface
          "surface-raised": "#0D1C18", // Hover / Active Raised Surface
          light: "#F4F6F8", // Crisp Text Primary
          cta: "#F59E0B", // Refined Warm Amber Accent
          "cta-hover": "#D97706",
          terracotta: "#D56B4A",
          counter: "#8E9DA8", // Editorial Muted Metadata
        },
        // Semantic status tokens
        status: {
          success: "#10B981",
          "success-subtle": "rgba(16, 185, 129, 0.10)",
          "success-border": "rgba(16, 185, 129, 0.22)",
          warning: "#F59E0B",
          "warning-subtle": "rgba(245, 158, 11, 0.10)",
          "warning-border": "rgba(245, 158, 11, 0.22)",
          danger: "#EF4444",
          "danger-subtle": "rgba(239, 68, 68, 0.10)",
          "danger-border": "rgba(239, 68, 68, 0.22)",
          info: "#38BDF8",
          "info-subtle": "rgba(56, 189, 248, 0.10)",
          "info-border": "rgba(56, 189, 248, 0.22)",
          neutral: "#94A3B8",
          "neutral-subtle": "rgba(148, 163, 184, 0.08)",
          "neutral-border": "rgba(255, 255, 255, 0.08)",
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
        xs: "3px",
        sm: "5px",
        md: "8px",
        lg: "12px",
        xl: "16px",
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
        "elevation-1": "0 1px 2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        "elevation-2": "0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.07)",
        "elevation-3": "0 12px 28px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        "elevation-4": "0 24px 48px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.10)",
        "subtle-amber": "0 0 0 1px rgba(245, 158, 11, 0.35)",
        "hairline": "0 0 0 1px rgba(255, 255, 255, 0.07)",
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

