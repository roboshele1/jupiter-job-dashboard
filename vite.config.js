import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  return {
    base: './',
    root: "electron/renderer",
    build: {
      outDir: "../../dist",
      emptyOutDir: true,
    },
    plugins: [react()],
    define: {
      process: {},
      "process.env": {
        VITE_ANTHROPIC_API_KEY: JSON.stringify(env.VITE_ANTHROPIC_API_KEY ?? ""),
      }
    },
    optimizeDeps: { exclude: ["dotenv"] }
  };
});
