import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  base: "./",
  build: {
    outDir: "../assets/react",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "slider-a.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "slider-a.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
