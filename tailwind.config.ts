import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0b0d12",
        panel: "#12151c",
        panel2: "#171b24",
        border: "#242936",
        accent: "#7c5cff",
        accent2: "#ff5c8a",
        ok: "#3ddc97",
        warn: "#ffb84d",
        danger: "#ff5c5c",
        muted: "#8a93a6",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
