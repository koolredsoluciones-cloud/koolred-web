import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#d2182a",
        "brand-blue": "#152354",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
};

export default config;
