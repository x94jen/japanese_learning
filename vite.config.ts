import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  base:
    loadEnv(mode, ".", "VITE_").VITE_BASE_PATH ||
    (mode === "production" ? "/japanese_learning/" : "/"),
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("supabase")) return "cloud";
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/scheduler")
          )
            return "react";
          if (id.endsWith("n3Expansion.json")) return "n3-material";
          if (id.endsWith("readings.json")) return "readings";
        },
      },
    },
  },
}));
