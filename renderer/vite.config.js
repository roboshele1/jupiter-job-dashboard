import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../");

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, projectRoot, "");
  return {
    plugins: [react({ jsxRuntime: "automatic" })],
    base: command === "build" ? "./" : "/",
    define: {
      "process.env.VITE_ANTHROPIC_API_KEY": JSON.stringify(env.VITE_ANTHROPIC_API_KEY ?? ""),
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      port: 5173,
    },
  };
});
