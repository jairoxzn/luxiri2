import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#D4AF37", // Gold principal
          foreground: "#080808",
          light: "#F2D675",
          dark: "#9D7625",
        },
        gold: {
          50: "#FCF9EC",
          100: "#F9F3D2",
          200: "#F2E5A1",
          300: "#F2D675",
          400: "#E2C355",
          500: "#D4AF37", // Core gold
          600: "#B9932B",
          700: "#9D7625", // Dark gold
          800: "#75551A",
          900: "#4D3611",
        },
        luxury: {
          black: "#080808",
          dark: "#141414",
          card: "#18181B",
          cardLight: "#27272A",
          gray: "#A1A1AA",
          lightGray: "#F7F7F7",
        },
        secondary: {
          DEFAULT: "#141414",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#D4AF37",
          foreground: "#080808",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F2D675 0%, #D4AF37 50%, #9D7625 100%)",
        "card-gradient": "linear-gradient(145deg, #1A1A1A 0%, #0A0A0A 100%)",
        "vip-platinum": "linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 50%, #4B5563 100%)",
        "vip-gold": "linear-gradient(135deg, #FDE68A 0%, #D4AF37 50%, #92400E 100%)",
        "vip-silver": "linear-gradient(135deg, #F3F4F6 0%, #D1D5DB 50%, #6B7280 100%)",
        "vip-bronze": "linear-gradient(135deg, #FED7AA 0%, #CD7F32 50%, #7C2D12 100%)",
      },
      boxShadow: {
        gold: "0 0 25px -5px rgba(212, 175, 55, 0.3)",
        "gold-sm": "0 0 10px -2px rgba(212, 175, 55, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;

