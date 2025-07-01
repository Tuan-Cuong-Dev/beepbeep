import type { Config } from "tailwindcss";
import lineClamp from '@tailwindcss/line-clamp'; // ✅ import plugin

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [lineClamp], // ✅ bật plugin ở đây
} satisfies Config;
